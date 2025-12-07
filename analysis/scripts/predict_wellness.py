import joblib
import numpy as np
import pandas as pd
import os # Added for path checking
from sentiment_engine import SentimentEngine # Import your class from Part 2
from Recommender import Recommender # Import your Recommender class

def get_nurture_me_prediction(user_metrics_dict, journal_text, consent=False):
    # 1. Load the ML Brains
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        model_path = os.path.join(base_dir, 'models', 'stress_model.pkl')
        if not os.path.exists(model_path):
             model_path = os.path.join(base_dir, 'stress_model.pkl')
             
        scaler_path = os.path.join(base_dir, 'models', 'scaler.pkl')
        if not os.path.exists(scaler_path):
             scaler_path = os.path.join(base_dir, 'scaler.pkl')

        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
    except FileNotFoundError:
        return "Error: Model files not found. Please run train_model.py first."

    # 2. Predict Stress Level (The Numeric Part)
    # Convert dictionary values to the list format the model expects
    # Note: Ensure the order matches StressLevelDataset.csv columns!
    try:
        # Try to align to scaler feature names if available
        feature_names = getattr(scaler, "feature_names_in_", None)
        if feature_names is not None:
            df = pd.DataFrame([ {c: user_metrics_dict.get(c, 0) for c in feature_names} ])
            features_array = df.values
        else:
            # Fallback: preserve insertion order but warn about potential mismatch
            features = list(user_metrics_dict.values())
            features_array = np.array([features])
    except Exception:
        features = list(user_metrics_dict.values())
        features_array = np.array([features])
    
    # Scale the data using the loaded scaler
    scaled_features = scaler.transform(features_array)
    
    # Get Prediction (0, 1, or 2)
    stress_level = model.predict(scaled_features)[0]

    # 3. Analyze Sentiment (The Text Part) - CHECK CONSENT
    if consent:
        engine = SentimentEngine()
        sentiment_result = engine.analyze(journal_text)
    else:
        sentiment_result = {
            "label": "Skipped",
            "score": 0.0
        }

    # 4. Generate Final Recommendation
    # Note: If consent is False, sentiment_label is "Skipped", need to handle that in generate_advice or accept it as is.
    # The requirement says: return "recommendation": "Consent not provided for text analysis." if consent is False.
    # However, generate_advice might still be useful for stress level only?
    # Requirement: "If False, return ... "recommendation": "Consent not provided for text analysis.""
    
    if consent:
        recommendation = generate_advice(stress_level, sentiment_result['label'])
    else:
        recommendation = "Consent not provided for text analysis."

    # Risk Flag Logic
    # Set risk_flag = True ONLY if 'stress_level' is 2 (High) AND 'sentiment_label' is "Negative". Otherwise False.
    risk_flag = False
    if stress_level == 2 and sentiment_result['label'] == "Negative":
        risk_flag = True

    # 5. Personalized recommendations using hybrid recommender
    try:
        recommender = Recommender()
        # Pass sentiment only if we have it? Recommender logic uses "Negative" for boosting.
        # If Skipped, it probably won't boost anything, which is fine.
        personalized = recommender.recommend(user_metrics_dict, sentiment_result['label'], top_k=5)
    except Exception:
        personalized = []

    return {
        "stress_level": int(stress_level),
        "sentiment": sentiment_result['label'],
        "sentiment_score": sentiment_result['score'],
        "recommendation": recommendation,
        "risk_flag": risk_flag,
        "personalized_recommendations": personalized
    }

def generate_advice(stress_level, sentiment_label):
    # Simple logic matrix for advice
    if stress_level == 2: # High Stress
        return "Your stress markers are high. Please take a break immediately."
    elif stress_level == 1: # Medium
        if sentiment_label == "Negative":
            return "You seem a bit down. Try a short walk or meditation."
        else:
            return "You are doing okay, but watch your workload."
    else: # Low Stress
        return "You are doing great! Keep up the good work."

# --- SIMULATING A USER SUBMISSION ---
if __name__ == "__main__":
    # Mock data from a user form
    # (Values corresponding to the 20 columns in your dataset)
    mock_user_metrics = {
        'anxiety': 10, 'esteem': 20, 'history': 0, 'depression': 5, 
        'headache': 2, 'bp': 2, 'sleep': 4, 'breathing': 1, 
        'noise': 2, 'living': 3, 'safety': 3, 'needs': 4, 
        'academic': 4, 'load': 2, 'teacher': 4, 'career': 2, 
        'support': 3, 'peer': 2, 'extra': 4, 'bullying': 1
    }
    
    mock_journal = "I had a pretty productive day today, feeling good!"

    result = get_nurture_me_prediction(mock_user_metrics, mock_journal)
    print("--- Final Nurture.Me Analysis ---")
    print(result)