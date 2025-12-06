from fastapi import FastAPI, HTTPException, Body, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os, warnings, joblib, pandas as pd, numpy as np
import re
import csv
import math
from collections import Counter
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Download VADER lexicon if needed
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')

# ----- Sentiment Engine Class (Embedded) -----
class SentimentEngine:
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()

    def analyze(self, text):
        if not text:
            return {"label": "Neutral", "score": 0.0}
        scores = self.sia.polarity_scores(text)
        compound_score = scores['compound']
        if compound_score >= 0.05:
            label = "Positive"
        elif compound_score <= -0.05:
            label = "Negative"
        else:
            label = "Neutral"
        return {
            "label": label,
            "score": compound_score,
            "raw_scores": scores
        }

# ----- Recommender Class (Embedded) -----
TAG_LIST = ["mindfulness", "breathing", "exercise", "sleep", "social", "journaling", "nutrition", "therapy", "time_management"]
ACTIVITY_CATALOG = [
    {"id": "a1", "title": "5-min Guided Breathing", "tags": ["breathing", "mindfulness"], "minutes": 5},
    {"id": "a2", "title": "10-min Mindfulness Meditation", "tags": ["mindfulness", "journaling"], "minutes": 10},
    {"id": "a3", "title": "20-min Walk / Light Exercise", "tags": ["exercise", "social"], "minutes": 20},
    {"id": "a4", "title": "Sleep Hygiene Checklist", "tags": ["sleep", "time_management"], "minutes": 10},
    {"id": "a5", "title": "Gratitude Journaling (10 min)", "tags": ["journaling", "mindfulness"], "minutes": 10},
    {"id": "a6", "title": "Healthy Snack Suggestions", "tags": ["nutrition"], "minutes": 5},
    {"id": "a7", "title": "Schedule Breaks & Pomodoro", "tags": ["time_management"], "minutes": 5},
    {"id": "a8", "title": "Peer Support Prompt (Message a friend)", "tags": ["social"], "minutes": 5},
    {"id": "a9", "title": "Therapist / Counselor Contact Resources", "tags": ["therapy"], "minutes": 2},
]
FIELD_TAG_MAP = {
    "sleep_quality": {"sleep": 1.0},
    "anxiety_level": {"mindfulness": 0.6, "breathing": 0.6, "therapy": 0.4},
    "depression": {"social": 0.5, "journaling": 0.6, "therapy": 0.6},
    "self_esteem": {"social": 0.3, "journaling": 0.2},
    "academic_performance": {"time_management": 0.6},
    "study_load": {"time_management": 0.6},
    "extracurricular_activities": {"social": 0.4, "exercise": 0.4},
}

def _tags_to_vector(tags):
    return [1.0 if t in tags else 0.0 for t in TAG_LIST]

def _cosine_sim(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    norm_a = math.sqrt(sum(x*x for x in a)) or 1e-9
    norm_b = math.sqrt(sum(x*x for x in b)) or 1e-9
    return dot / (norm_a * norm_b)

class Recommender:
    def __init__(self, interactions_path=None):
        self.items = ACTIVITY_CATALOG
        for it in self.items:
            it["tag_vector"] = _tags_to_vector(it["tags"])
        
        # Default path relative to this file
        if interactions_path is None:
             base_dir = os.path.dirname(os.path.abspath(__file__))
             self.interactions_path = os.path.join(base_dir, 'data', 'interactions.csv')
        else:
             self.interactions_path = interactions_path
            
        # Ensure dir exists
        try:
             os.makedirs(os.path.dirname(self.interactions_path), exist_ok=True)
        except Exception:
             pass
             
        self.popularity = self._load_popularity()

    def log_interaction(self, user_id, item_id, feedback_score):
        try:
            file_exists = os.path.exists(self.interactions_path)
            with open(self.interactions_path, mode='a', newline='') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['user_id', 'item_id', 'feedback'])
                writer.writerow([user_id, item_id, feedback_score])
            self.popularity[item_id] += 1
        except Exception as e:
            print(f"Error logging interaction: {e}")

    def _load_popularity(self):
        if not os.path.exists(self.interactions_path):
            return Counter()
        pop = Counter()
        try:
            with open(self.interactions_path, newline="") as f:
                r = csv.reader(f)
                for row in r:
                    if len(row) < 2: continue
                    item_id = row[1]
                    pop[item_id] += 1
        except Exception:
            return Counter()
        return pop

    def _build_user_vector(self, user_metrics, sentiment_label):
        vec = [0.0] * len(TAG_LIST)
        for field, mapping in FIELD_TAG_MAP.items():
            if field in user_metrics:
                try: val = float(user_metrics[field])
                except: val = 0.0
                if val > 20: val = val / (val + 10)
                else: val = val / 10.0
                for tag, w in mapping.items():
                    if tag in TAG_LIST:
                        vec[TAG_LIST.index(tag)] += w * val
        if sentiment_label == "Negative":
            for t in ["social", "therapy", "journaling"]:
                if t in TAG_LIST: vec[TAG_LIST.index(t)] += 0.6
        elif sentiment_label == "Positive":
            for t in ["exercise", "time_management"]:
                if t in TAG_LIST: vec[TAG_LIST.index(t)] += 0.3
        norm = math.sqrt(sum(x*x for x in vec)) or 1e-9
        return [x / norm for x in vec]

    def recommend(self, user_metrics, sentiment_label, top_k=5):
        user_vec = self._build_user_vector(user_metrics, sentiment_label)
        scored = []
        for it in self.items:
            sim = _cosine_sim(user_vec, it["tag_vector"])
            pop_bonus = math.log1p(self.popularity.get(it["id"], 0))
            score = sim * 0.8 + 0.2 * (pop_bonus / (1 + pop_bonus))
            scored.append((score, it))
        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, it in scored[:top_k]:
            results.append({
                "id": it["id"], "title": it["title"], "tags": it["tags"], "minutes": it.get("minutes"), "score": round(float(score), 4)
            })
        return results



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
STRESS_MODEL_PATH = os.path.join(MODELS_DIR, "stress_model.pkl") # Updated to new model
SCALER_PATH       = os.path.join(MODELS_DIR, "scaler.pkl")       # Added scaler
HABIT_MODEL_PATH  = os.path.join(MODELS_DIR, "habit_adherence_model.pkl")
MOOD_MODEL_PATH   = os.path.join(MODELS_DIR, "mood_tracking_model.pkl")  # optional
MENTAL_TRAIN_CSV  = os.path.join(DATA_DIR, "mental_disorder.csv")

# ----- Globals -----
mental_bundle: Optional[Dict[str, Any]] = None   # {"model","scaler","feature_names"}
stress_model = None
stress_scaler = None  # Scaler for stress model
recommender = None    # Recommender instance
sent_engine = None    # SentimentEngine instance
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
    global mental_bundle, stress_model, stress_scaler, habit_model, mood_model, vader
    global label_encoders, feature_names, scaler, mental_classes, recommender, sent_engine

    # Initialize Recommender & Sentiment Engine
    try:
        recommender = Recommender(interactions_path=os.path.join(DATA_DIR, "interactions.csv"))
        sent_engine = SentimentEngine()
        print("[INFO] Recommender and SentimentEngine initialized")
    except Exception as e:
        print(f"[WARN] Failed to init engines: {e}")

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
            print("[INFO] Stress model loaded")
        except Exception as e:
            print(f"[WARN] stress model load fail: {e}")

    if os.path.exists(SCALER_PATH):
        try:
            globals()["stress_scaler"] = joblib.load(SCALER_PATH)
            print("[INFO] Stress scaler loaded")
        except Exception as e:
            print(f"[WARN] stress scaler load fail: {e}")

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

class WellnessPayload(BaseModel):
    # Matches the analysis script expected metrics
    anxiety: float = 0
    esteem: float = 20
    depression: float = 0
    headache: float = 0
    bp: float = 0
    sleep: float = 0
    breathing: float = 0
    noise: float = 0
    living: float = 0
    safety: float = 0
    needs: float = 0
    academic: float = 0
    load: float = 0
    teacher: float = 0
    career: float = 0
    support: float = 0
    peer: float = 0
    extra: float = 0
    bullying: float = 0
    history: float = 0 # Added missing field based on usage
    
    journal: str = Field(..., description="Journal entry for sentiment analysis")
    consent: bool = Field(False, description="Consent to analyze text")

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
                "It sounds like you might be feeling hopeless. You are not alone — help is available right now. "
                "In India, you can call **14416** (Tele-MANAS) or **112** for immediate support. "
                "There are people who want to listen and help you through this 🇮🇳💛."
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
    if any(w in t for w in ["tired", "exhausted", "drained", "burned out", "sleepy"]):
        emotion = "fatigue"
    elif any(w in t for w in ["anxious", "nervous", "worried", "scared", "fear", "panic"]):
        emotion = "anxiety"
    elif any(w in t for w in ["lonely", "alone", "isolated", "miss"]):
        emotion = "loneliness"
    elif any(w in t for w in ["angry", "mad", "furious", "annoyed", "rage", "hate"]):
        emotion = "anger"
    elif any(w in t for w in ["sad", "down", "upset", "cry", "hurt", "broken", "pain"]):
        emotion = "sadness"
    elif any(w in t for w in ["bully", "bullied", "mocked", "harassed", "insulted", "mean"]):
        emotion = "bullying"
    elif any(w in t for w in ["happy", "good", "great", "nice", "awesome", "love", "excited", "joy", "best"]):
        emotion = "joy"
    elif any(w in t for w in ["meh", "ok", "fine", "whatever", "idk"]):
        emotion = "apathy"

    # --- Summary generation ---
    summaries = {
        "positive": "You sound optimistic and strong today 🌞 Keep holding onto that energy — it fuels growth and joy.",
        "joy": "I'm so glad to hear that! It’s wonderful to celebrate these good moments 🌟.",
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
    
    # Priority: Specific Emotion > Label Summary > General Fallback
    if emotion != "general" and emotion in summaries:
        summary = summaries[emotion]
    else:
        summary = summaries.get(label, summaries["general"])

    return {
        "label": label,
        "emotion_detected": emotion,
        "summary": summary,
        "scores": scores,
    }

@predict.post("/wellness")
def predict_wellness(payload: WellnessPayload):
    # 1. Stress Prediction
    stress_level = -1
    if stress_model and stress_scaler:
        try:
            # Map payload to dict
            metrics = payload.dict(exclude={"journal", "consent"})
            
            # Align features with scaler
            feature_names = getattr(stress_scaler, "feature_names_in_", None)
            if feature_names is not None:
                 # Create DF with ordered columns
                 df = pd.DataFrame([ {c: metrics.get(c, 0) for c in feature_names} ])
                 X = df.values
            else:
                 X = np.array([list(metrics.values())])
            
            X_scaled = stress_scaler.transform(X)
            stress_level = int(stress_model.predict(X_scaled)[0])
        except Exception as e:
            print(f"[WARN] Wellness stress predict error: {e}")
    
    # 2. Sentiment Analysis
    sentiment_label = "Skipped"
    sentiment_score = 0.0
    
    if payload.consent and sent_engine:
        res = sent_engine.analyze(payload.journal)
        sentiment_label = res["label"]
        sentiment_score = res["score"]
    elif payload.consent and not sent_engine:
        # Fallback to internal VADER if new engine fails
        if vader:
            sc = vader.polarity_scores(payload.journal)
            sentiment_score = sc['compound']
            if sentiment_score >= 0.05: sentiment_label = "Positive"
            elif sentiment_score <= -0.05: sentiment_label = "Negative"
            else: sentiment_label = "Neutral"

    # 3. Recommendations
    rec_text = "Consent not provided for text analysis."
    if payload.consent:
        if stress_level == 2:
            rec_text = "Your stress markers are high. Please take a break immediately."
        elif stress_level == 1:
            if sentiment_label == "Negative":
                rec_text = "You seem a bit down. Try a short walk or meditation."
            else:
                rec_text = "You are doing okay, but watch your workload."
        else:
             rec_text = "You are doing great! Keep up the good work."

    personalized = []
    if recommender:
        try:
            # Pass dictionary of metrics
            personalized = recommender.recommend(payload.dict(), sentiment_label, top_k=5)
        except Exception as e:
            print(f"[WARN] Recommender error: {e}")

    # Risk Flag
    risk_flag = False
    if stress_level == 2 and sentiment_label == "Negative":
        risk_flag = True

    return {
        "stress_level": stress_level,
        "sentiment": sentiment_label,
        "sentiment_score": sentiment_score,
        "recommendation": rec_text,
        "risk_flag": risk_flag,
        "personalized_recommendations": personalized
    }




app.include_router(predict)

# Log routes at startup for sanity
@app.on_event("startup")
def _log_routes():
    print("=== ROUTES LOADED ===")
    for r in app.router.routes:
        methods = ",".join(sorted(getattr(r, "methods", []))) if hasattr(r, "methods") else ""
        print(f"{methods:10s} {getattr(r, 'path', str(r))}")
