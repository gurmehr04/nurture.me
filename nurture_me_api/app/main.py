from fastapi import FastAPI, HTTPException, Body, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os, warnings, joblib, pandas as pd, numpy as np
import re

# Optional VADER fallback
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except Exception:
    SentimentIntensityAnalyzer = None

# Silence sklearn pickle warnings
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except Exception:
    pass

# ----- App -----
app = FastAPI(title="Nurture.Me API", version="1.2.0", docs_url="/docs", openapi_url="/openapi.json")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

# ----- Paths -----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

DATA_DIR   = os.path.join(BASE_DIR, "data")

MENTAL_MODEL_PATH = os.path.join(MODELS_DIR, "mental_health_model.pkl")
STRESS_MODEL_PATH = os.path.join(MODELS_DIR, "stress_detection_model.pkl")
HABIT_MODEL_PATH  = os.path.join(MODELS_DIR, "habit_adherence_model.pkl")
MOOD_MODEL_PATH   = os.path.join(MODELS_DIR, "mood_tracking_model.pkl")  # optional
MENTAL_TRAIN_CSV  = os.path.join(DATA_DIR, "mental_disorder.csv")

# ----- Globals -----
mental_bundle: Optional[Dict[str, Any]] = None   # {"model","scaler","feature_names"}
stress_model = None
habit_model  = None
mood_model   = None                               # {"pipeline", "labels"}
vader        = None

label_encoders: Dict[str, Dict[str, int]] = {}
feature_names: List[str] = []
scaler = None
mental_classes: Optional[List[str]] = None


# Negation-aware relief patterns (covers don't/dont/do not/no longer/anymore + "dying")
RELIEF_PATTERNS = [
    # e.g., "I dont feel like dying", "I don't want to die", "I do not think about killing myself"
    r"\b(?:don'?t|dont|do not|no longer|not|never)\s+"
    r"(?:want(?:\s+to)?|feel(?:ing)?(?:\s+like)?|think\s+about)?\s*(?:to\s*)?"
    r"(?:die|dying|end\s+(?:my|the)\s+life|kill\s+myself|end\s+it\s+all)\b",

    # e.g., "I no longer want to die", "I don't want to die anymore"
    r"\bi\s+(?:no\s+longer|not|don'?t|dont|do\s+not)\s+"
    r"(?:want(?:\s+to)?|feel(?:ing)?(?:\s+like)?)\s*(?:to\s*)?"
    r"(?:die|dying|end\s+(?:my|the)\s+life|kill\s+myself|end\s+it\s+all)\b",

    # e.g., "not suicidal", "no longer suicidal", "I'm not suicidal"
    r"\b(?:not\s+suicidal|no\s+longer\s+suicidal|i'?m\s+not\s+suicidal|im\s+not\s+suicidal)\b",
]

CRISIS_PATTERNS = [
    r"\bkill\s+myself\b",
    r"\bend\s+my\s+life\b",
    r"\bsuicide\b",
    r"\bwant(?:\s+to)?\s+die\b",
    r"\bwant(?:\s+to)?\s+end\s+it\s+all\b",
    r"\bfeel(?:ing)?\s+like\s+dying\b",
    r"\bi\s+(?:want(?:\s+to)?\s+die|feel(?:ing)?\s+like\s+dying)\b",
]

def is_relief(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in RELIEF_PATTERNS)

def is_crisis(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in CRISIS_PATTERNS)

NEG_OVERRIDE = {
    "bully","bullied","harass","harassed","harassment","picked on",
    "made fun","insult","insulted","mock","mocked","tease","teased",
    "abuse","abused","slur","name-calling","threat","threatened"
}

def _has_neg_override(txt: str) -> bool:
    t = txt.lower()
    return any(k in t for k in NEG_OVERRIDE)

def _summary_for(label: str) -> str:
    if label == "negative":
        return ("That sounds really hard. You didn’t deserve that. "
                "Consider telling someone you trust, and be kind to yourself today. "
                "I can help you plan next steps.")
    if label == "positive":
        return ("Nice—there are some good feelings here. "
                "Let’s note what helped so you can repeat it.")
    return ("Noted. Your mood seems steady overall. "
            "Add more context if you’d like me to unpack it.")

# ----- Utils -----
def _fit_label_encoders_from_csv(csv_path: str) -> Dict[str, Dict[str, int]]:
    df = pd.read_csv(csv_path)
    drop_cols = {"Patient Number", "Expert Diagnose"}
    encoders: Dict[str, Dict[str, int]] = {}
    for col in df.columns:
        if col in drop_cols: continue
        if df[col].dtype == object:
            uniques = sorted(list(pd.Series(df[col].dropna().unique()).astype(str)))
            encoders[col] = {cls: idx for idx, cls in enumerate(uniques)}
    return encoders

def _encode_payload(payload: Dict[str, Any], encoders: Dict[str, Dict[str, int]]) -> Dict[str, Any]:
    out = {}
    for k, v in payload.items():
        if k in encoders:
            if v is None:
                raise HTTPException(400, detail=f"Missing value for '{k}'")
            key = str(v)
            mapping = encoders[k]
            if key not in mapping:
                raise HTTPException(400, detail=f"Unknown value '{key}' for '{k}'. Allowed: {list(mapping.keys())}")
            out[k] = mapping[key]
        else:
            out[k] = v
    return out

# ----- Startup loader -----
@app.on_event("startup")
def load_artifacts():
    global mental_bundle, stress_model, habit_model, mood_model, vader
    global label_encoders, feature_names, scaler, mental_classes

    if os.path.exists(MENTAL_MODEL_PATH):
        mental_bundle = joblib.load(MENTAL_MODEL_PATH)
        for req in ("model", "scaler", "feature_names"):
            if req not in mental_bundle:
                raise RuntimeError(f"mental_health_model.pkl missing '{req}'")
        feature_names[:] = list(mental_bundle["feature_names"])
        scaler = mental_bundle["scaler"]
        try:
            mental_classes = list(mental_bundle["model"].classes_)
        except Exception:
            mental_classes = None
        if os.path.exists(MENTAL_TRAIN_CSV):
            label_encoders.clear()
            label_encoders.update(_fit_label_encoders_from_csv(MENTAL_TRAIN_CSV))
        else:
            label_encoders.clear()

    if os.path.exists(STRESS_MODEL_PATH):
        try:
            globals()["stress_model"] = joblib.load(STRESS_MODEL_PATH)
        except Exception as e:
            print(f"[WARN] stress model load fail: {e}")

    if os.path.exists(HABIT_MODEL_PATH):
        try:
            globals()["habit_model"] = joblib.load(HABIT_MODEL_PATH)
        except Exception as e:
            print(f"[WARN] habit model load fail: {e}")

    if os.path.exists(MOOD_MODEL_PATH):
        try:
            globals()["mood_model"] = joblib.load(MOOD_MODEL_PATH)  # {"pipeline","labels"}
            print("[INFO] mood_tracking_model loaded")
        except Exception as e:
            print(f"[WARN] mood model load fail: {e}")

    if mood_model is None and SentimentIntensityAnalyzer is not None:
        globals()["vader"] = SentimentIntensityAnalyzer()
        print("[INFO] Using VADER fallback for text sentiment")

# ----- Schemas -----
class SimpleVector(BaseModel):
    features: List[float] = Field(..., description="Numeric feature vector")

class TextPayload(BaseModel):
    text: str = Field(..., min_length=3, description="Free text journal entry")

# ----- System/Meta -----
@app.get("/healthz", tags=["System"])
def healthz():
    return {"status": "ok"}

@app.get("/meta/mental", tags=["Meta"])
def mental_meta():
    return {
        "feature_names": feature_names,
        "categorical_encoders": {k: list(v.keys()) for k, v in label_encoders.items()},
        "classes": mental_classes,
    }

# ----- Predict router -----
predict = APIRouter(prefix="/predict", tags=["Predict"])

@predict.post("/mental-health")
def predict_mental(payload: Dict[str, Any] = Body(...)):
    if mental_bundle is None:
        raise HTTPException(503, "Mental health model not loaded")
    missing = [f for f in feature_names if f not in payload]
    if missing:
        raise HTTPException(400, detail=f"Missing features: {missing}")
    encoded = _encode_payload({k: payload[k] for k in feature_names}, label_encoders)
    X  = pd.DataFrame([encoded])[feature_names]
    Xs = scaler.transform(X)
    model = mental_bundle["model"]
    y = model.predict(Xs)[0]
    proba = model.predict_proba(Xs)[0].tolist() if hasattr(model, "predict_proba") else None
    return {"prediction": str(y), "proba": proba, "classes": mental_classes}

@predict.post("/stress")
def predict_stress(vec: SimpleVector):
    if stress_model is None:
        raise HTTPException(503, "Stress model not loaded")
    X = np.array(vec.features, dtype=float).reshape(1, -1)
    try:
        y = stress_model.predict(X)[0]
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    return {"prediction": str(y)}

@predict.post("/habit")
def predict_habit(vec: SimpleVector):
    if habit_model is None:
        raise HTTPException(503, "Habit adherence model not loaded")
    X = np.array(vec.features, dtype=float).reshape(1, -1)
    try:
        y = habit_model.predict(X)[0]
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    return {"prediction": str(y)}

@predict.post("/text-sentiment")
def predict_text_sentiment(payload: TextPayload):
    txt = payload.text.strip()
    if not txt:
        raise HTTPException(400, "Text is empty")

    # ---- Crisis / Relief detection (runs first) ----
    if is_relief(txt):
        return {
            "label": "positive",
            "emotion_detected": "relief",
            "summary": (
                "It sounds like you’re feeling safer and more hopeful today 💛. "
                "That’s a meaningful step forward — notice what helped you feel this way."
            ),
            "scores": {"relief": 1.0},
        }

    if is_crisis(txt):
        return {
            "label": "crisis",
            "emotion_detected": "self-harm risk",
            "summary": (
                "It sounds like you might be feeling hopeless or thinking about ending your life. "
                "You're not alone — help is available right now. If you’re in danger, please reach out:\n"
                "• In the U.S., call or text **988** (Suicide & Crisis Lifeline)\n"
                "• Outside the U.S., see international hotlines: https://findahelpline.com\n"
                "You deserve care and safety. Please don’t face this alone 💛."
            ),
            "scores": {"crisis": 1.0},
        }
    # ---- End crisis / relief ----

    # --- VADER base sentiment (define scores/comp here) ---
    if vader is None:
        raise HTTPException(503, "No text model available on server")
    scores = vader.polarity_scores(txt)
    comp = scores["compound"]

    # --- Base label thresholds ---
    if comp <= -0.10 or scores["neg"] >= 0.20:
        label = "negative"
    elif comp >= 0.50 and scores["pos"] > scores["neg"]:
        label = "positive"
    else:
        label = "neutral"

    # --- Context-specific reasoning ---
    t = txt.lower()
    emotion = "general"
    if any(w in t for w in ["tired", "exhausted", "drained", "burned out"]):
        emotion = "fatigue"
    elif any(w in t for w in ["anxious", "nervous", "worried", "scared", "fear"]):
        emotion = "anxiety"
    elif any(w in t for w in ["lonely", "alone", "isolated"]):
        emotion = "loneliness"
    elif any(w in t for w in ["angry", "mad", "furious", "annoyed", "rage"]):
        emotion = "anger"
    elif any(w in t for w in ["sad", "down", "upset", "cry", "hurt", "broken"]):
        emotion = "sadness"
    elif any(w in t for w in ["bully", "bullied", "mocked", "harassed", "insulted", "made fun"]):
        emotion = "bullying"
    elif any(w in t for w in ["meh", "ok", "fine", "whatever", "idk"]):
        emotion = "apathy"

    # --- Summary generation ---
    summaries = {
        "positive": "You sound optimistic and strong today 🌞 Keep holding onto that energy — it fuels growth and joy.",
        "neutral": "You seem steady and reflective. It’s okay to have neutral days — not every day has to be extreme 🌿.",
        "sadness": "It sounds like you’re feeling down. You deserve comfort and understanding. Try taking a small break and showing yourself some care 💛.",
        "fatigue": "You seem really tired — maybe mentally or physically. Rest isn’t laziness; it’s recovery. Please recharge 🌙.",
        "anxiety": "That sounds stressful and overwhelming. Remember to slow your breathing — small steps ease the storm 🌬️.",
        "loneliness": "Feeling lonely can be heavy. You’re not truly alone — there are people and spaces that care 🤍.",
        "anger": "That sounds frustrating. Your feelings are valid, but take a moment to breathe before reacting — peace helps you stay in control 🔥.",
        "bullying": "That must’ve been painful. No one deserves disrespect or ridicule. You matter more than their words 💔.",
        "apathy": "Feeling ‘meh’ happens — it’s a quiet signal to rest or find small joys again. Even tiny sparks count ✨.",
        "general": "You seem like you’re processing something. Let’s unpack it together if you want to talk more 💬.",
    }
    summary = summaries.get(emotion, summaries.get(label, summaries["general"]))

    return {
        "label": label,
        "emotion_detected": emotion,
        "summary": summary,
        "scores": scores,
    }




app.include_router(predict)

# Log routes at startup for sanity
@app.on_event("startup")
def _log_routes():
    print("=== ROUTES LOADED ===")
    for r in app.router.routes:
        methods = ",".join(sorted(getattr(r, "methods", []))) if hasattr(r, "methods") else ""
        print(f"{methods:10s} {getattr(r, 'path', str(r))}")
