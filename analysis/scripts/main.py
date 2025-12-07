import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentiment_engine import SentimentEngine
from Recommender import Recommender

# Initialize FastAPI App
app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Variables ---
model = None
scaler = None
sentiment_engine = None
recommender = None

# --- Startup ---
@app.on_event("startup")
def load_models():
    global model, scaler, sentiment_engine, recommender
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'stress_model.pkl')
    scaler_path = os.path.join(base_dir, 'scaler.pkl')

    print(f"Loading models from: {base_dir}")

    try:
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print("Stress Model loaded.")
        else:
            print(f"WARNING: stress_model.pkl not found at {model_path}")

        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print("Scaler loaded.")
        else:
            print(f"WARNING: scaler.pkl not found at {scaler_path}")
            
        sentiment_engine = SentimentEngine()
        print("Sentiment Engine initialized.")

        recommender = Recommender()
        print("Recommender initialized.")
        
    except Exception as e:
        print(f"Error loading models: {e}")

# --- Schemas ---
class StressInput(BaseModel):
    sleep_hours: float
    water_intake: float
    physical_activity: float
    sentiment_label: str = "Neutral"

class SentimentInput(BaseModel):
    text: str

class FeedbackInput(BaseModel):
    user_id: str
    item_id: str
    feedback: int

# --- Endpoints ---

@app.get("/")
def home():
    return {"message": "Nurture.Me Python ML Microservice is Running"}

@app.post("/predict-stress")
def predict_stress(data: StressInput):
    if not model or not scaler:
        raise HTTPException(status_code=503, detail="Models not loaded")

    try:
        # Heuristic Mapping (Matches previous logic)
        features = [3] * 20
        # sleep_quality (index 6)
        features[6] = max(0, min(5, int(data.sleep_hours / 2)))
        # extracurricular (index 18)
        features[18] = int(data.physical_activity)
        # basic_needs (index 11) - mapping water here
        features[11] = int(data.water_intake)

        features_array = np.array([features])
        scaled_features = scaler.transform(features_array)
        
        prediction = model.predict(scaled_features)[0]
        stress_level = int(prediction)
        risk_flag = (stress_level == 2)

        # Recommendations
        recommendations = []
        if recommender:
            mapped_metrics = {
                "sleep_quality": features[6],
                "extracurricular_activities": features[18],
                "basic_needs": features[11]
            }
            recommendations = recommender.recommend(mapped_metrics, data.sentiment_label)

        return {
            "stress_level": stress_level,
            "risk_flag": risk_flag,
            "personalized_recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sentiment")
def analyze_sentiment(data: SentimentInput):
    if not sentiment_engine:
        raise HTTPException(status_code=503, detail="Sentiment Engine not initialized")
        
    try:
        result = sentiment_engine.analyze(data.text)
        return {
            "sentiment_score": result["score"],
            "sentiment_label": result["label"],
            "raw_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
def feedback(data: FeedbackInput):
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommender not initialized")
    
    try:
        recommender.log_interaction(data.user_id, data.item_id, data.feedback)
        return {"message": "Feedback logged", "item_id": data.item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)