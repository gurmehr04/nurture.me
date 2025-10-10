from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import os
import joblib
import pandas as pd
import numpy as np
import warnings

# Try to import VADER for fallback text sentiment
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except Exception:
    SentimentIntensityAnalyzer = None

# Quiet sklearn version warnings in console (your pickles were trained on older sklearn)
try:
    from sklearn.exceptions import InconsistentVersionWarning
    warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
except Exception:
    pass

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

MENTAL_MODEL_PATH = os.path.join(MODELS_DIR, "mental_health_model.pkl")
STRESS_MODEL_PATH = os.path.join(MODELS_DIR, "stress_detection_model.pkl")
HABIT_MODEL_PATH = os.path.join(MODELS_DIR, "habit_adherence_model.pkl")
MOOD_MODEL_PATH = os.path.join(MODELS_DIR, "mood_tracking_model.pkl")  # <— NEW (optional)
MENTAL_TRAIN_CSV = os.path.join(DATA_DIR, "mental_disorder.csv")

app = FastAPI(title="Nurture.Me API", version="1.1.0")

# CORS: lock this down to your domain(s) in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Globals loaded at startup -----
mental_bundle = None   # dict: {"model": clf, "scaler": scaler, "feature_names": list}
stress_model = None
habit_model = None
mood_model = None      # dict: {"pipeline": sklearn Pipeline, "labels": [...]}
vader = None           # fallback sentiment analyzer

label_encoders: Dict[str, Dict[str, int]] = {}
feature_names: List[str] = []
scaler = None
mental_classes: Optional[List[str]] = None


def _fit_label_encoders_from_csv(csv_path: str) -> Dict[str, Dict[str, int]]:
    """
    Recreate LabelEncoder mappings using the training CSV.
    Assumes original training used sklearn's LabelEncoder (alphabetical order).
    """
    df = pd.read_csv(csv_path)
    drop_cols = {"Patient Number", "Expert Diagnose"}  # id & target columns in your data
    encoders: Dict[str, Dict[str, int]] = {}
    for col in df.columns:
        if col in drop_cols:
            continue
        if df[col].dtype == object:
            uniques = sorted(list(pd.Series(df[col].dropna().unique()).astype(str)))
            encoders[col] = {cls: idx for idx, cls in enumerate(uniques)}
    return encoders


def _encode_payload(payload: Dict[str, Any], encoders: Dict[str, Dict[str, int]]) -> Dict[str, Any]:
    encoded = {}
    for k, v in payload.items():
        if k in encoders:
            if v is None:
                raise HTTPException(400, detail=f"Missing value for categorical feature '{k}'")
            v_str = str(v)
            mapping = encoders[k]
            if v_str not in mapping:
                raise HTTPException(400, detail=f"Unknown value '{v_str}' for feature '{k}'. Allowed: {list(mapping.keys())}")
            encoded[k] = mapping[v_str]
        else:
            # numeric or not treated as categorical
            encoded[k] = v
    return encoded


@app.on_event("startup")
def load_artifacts():
    global mental_bundle, stress_model, habit_model, mood_model, vader
    global label_encoders, feature_names, scaler, mental_classes

    # --- Mental health bundle (diagnosis) ---
    if os.path.exists(MENTAL_MODEL_PATH):
        mental_bundle = joblib.load(MENTAL_MODEL_PATH)
        for required in ("model", "scaler", "feature_names"):
            if required not in mental_bundle:
                raise RuntimeError(f"mental_health_model.pkl is missing key '{required}'")
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

    # --- Stress model ---
    if os.path.exists(STRESS_MODEL_PATH):
        try:
            stress_model = joblib.load(STRESS_MODEL_PATH)
        except Exception as e:
            print(f"[WARN] Failed to load stress model: {e}")
            stress_model = None

    # --- Habit model ---
    if os.path.exists(HABIT_MODEL_PATH):
        try:
            habit_model = joblib.load(HABIT_MODEL_PATH)
        except Exception as e:
            print(f"[WARN] Failed to load habit model: {e}")
            habit_model = None

    # --- Mood (text) model (optional) ---
    if os.path.exists(MOOD_MODEL_PATH):
        try:
            mood_model = joblib.load(MOOD_MODEL_PATH)  # expects {"pipeline": ..., "labels": [...]}
            print("[INFO] mood_tracking_model loaded")
        except Exception as e:
            print(f"[WARN] Failed to load mood model: {e}")
            mood_model = None

    # Fallback sentiment if mood model not provided
    if mood_model is None and SentimentIntensityAnalyzer is not None:
        vader = SentimentIntensityAnalyzer()
        print("[INFO] Using VADER fallback for text sentiment")


class SimpleVector(BaseModel):
    features: List[float] = Field(..., description="Numeric feature vector")


class TextPayload(BaseModel):
    text: str = Field(..., min_length=3, description="Free text journal entry")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/meta/mental")
def mental_meta():
    return {
        "feature_names": feature_names,
        "categorical_encoders": {k: list(v.keys()) for k, v in label_encoders.items()},
        "classes": mental_classes,
    }


@app.post("/predict/mental-health")
def predict_mental(payload: Dict[str, Any] = Body(...)):
    """
    Accepts a JSON object with keys matching feature_names.
    Categorical features can be sent as human-readable strings.
    """
    if mental_bundle is None:
        raise HTTPException(503, "Mental health model not loaded on server")

    body = payload
    missing = [f for f in feature_names if f not in body]
    if missing:
        raise HTTPException(400, detail=f"Missing required features: {missing}")

    # Encode categoricals -> numeric, preserve numeric as-is
    encoded = _encode_payload({k: body[k] for k in feature_names}, label_encoders)

    # Build DataFrame in correct column order
    X = pd.DataFrame([encoded])[feature_names]

    # Scale & predict
    Xs = scaler.transform(X)
    model = mental_bundle["model"]
    y_pred = model.predict(Xs)[0]

    proba = model.predict_proba(Xs)[0].tolist() if hasattr(model, "predict_proba") else None

    return {"prediction": str(y_pred), "proba": proba, "classes": mental_classes}


@app.post("/predict/stress")
def predict_stress(vec: SimpleVector):
    if stress_model is None:
        raise HTTPException(503, "Stress model not loaded on server")
    X = np.array(vec.features, dtype=float).reshape(1, -1)
    try:
        pred = getattr(stress_model, "predict")(X)[0]
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    return {"prediction": str(pred)}


@app.post("/predict/habit")
def predict_habit(vec: SimpleVector):
    if habit_model is None:
        raise HTTPException(503, "Habit adherence model not loaded on server")
    X = np.array(vec.features, dtype=float).reshape(1, -1)
    try:
        pred = getattr(habit_model, "predict")(X)[0]
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    return {"prediction": str(pred)}


@app.post("/predict/text-sentiment")
def predict_text_sentiment(payload: TextPayload):
    """
    Use your text mood model (mood_tracking.py) if available, otherwise VADER fallback.
    Returns a simple label, and proba/classes if the sklearn model supports it.
    """
    txt = payload.text.strip()
    if not txt:
        raise HTTPException(400, "Text is empty")

    # Preferred: your saved sklearn Pipeline
    if mood_model is not None:
        pipe = mood_model.get("pipeline")
        labels: Optional[List[str]] = mood_model.get("labels")
        if pipe is None:
            raise HTTPException(500, "Mood model missing 'pipeline' key")
        # predict
        y = pipe.predict([txt])[0]
        out = {"label": str(y)}
        if hasattr(pipe, "predict_proba"):
            proba = pipe.predict_proba([txt])[0].tolist()
            out["proba"] = proba
            out["classes"] = labels
        return out

    # Fallback: VADER sentiment
    if vader is None:
        raise HTTPException(503, "No text model available on server")
    scores = vader.polarity_scores(txt)
    comp = scores["compound"]
    label = "positive" if comp >= 0.35 else "negative" if comp <= -0.35 else "neutral"
    return {"label": label, "scores": scores}
