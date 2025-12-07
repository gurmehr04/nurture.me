import os
import csv
import math
from collections import Counter
import joblib
import numpy as np
import pandas as pd
from sentiment_engine import SentimentEngine # Import your class from Part 2

# Simple tag vocabulary for activity catalog
TAG_LIST = ["mindfulness", "breathing", "exercise", "sleep", "social", "journaling", "nutrition", "therapy", "time_management"]

# Expanded activity catalog
ACTIVITY_CATALOG = [
    {"id": "a1", "title": "5-min Guided Breathing", "tags": ["breathing", "mindfulness"], "minutes": 5},
    {"id": "a2", "title": "10-min Mindfulness Meditation", "tags": ["mindfulness", "journaling"], "minutes": 10},
    {"id": "a3", "title": "20-min Walk / Light Exercise", "tags": ["exercise", "social"], "minutes": 20},
    {"id": "a4", "title": "Sleep Hygiene Checklist", "tags": ["sleep", "time_management"], "minutes": 10},
    {"id": "a5", "title": "Gratitude Journaling", "tags": ["journaling", "mindfulness"], "minutes": 10},
    {"id": "a6", "title": "Healthy Snack Suggestions", "tags": ["nutrition"], "minutes": 5},
    {"id": "a7", "title": "Pomodoro Focus Session", "tags": ["time_management"], "minutes": 25},
    {"id": "a8", "title": "Message a Friend", "tags": ["social"], "minutes": 5},
    {"id": "a9", "title": "Therapist Resources", "tags": ["therapy"], "minutes": 2},
    {"id": "a10", "title": "Yoga Stretches", "tags": ["exercise", "mindfulness"], "minutes": 15},
    {"id": "a11", "title": "Read a Book Chapter", "tags": ["mindfulness"], "minutes": 15},
    {"id": "a12", "title": "Hydration Reminder", "tags": ["nutrition"], "minutes": 1},
    {"id": "a13", "title": "Digital Detox (1 hr)", "tags": ["time_management", "sleep"], "minutes": 60},
    {"id": "a14", "title": "Listen to Calming Music", "tags": ["mindfulness", "breathing"], "minutes": 10},
    {"id": "a15", "title": "Plan Tomorrow's Tasks", "tags": ["time_management", "journaling"], "minutes": 10},
    {"id": "a16", "title": "Quick HIIT Workout", "tags": ["exercise"], "minutes": 10},
    {"id": "a17", "title": "Cook a Healthy Meal", "tags": ["nutrition", "mindfulness"], "minutes": 30},
    {"id": "a18", "title": "Join a Club/Group", "tags": ["social"], "minutes": 60},
    {"id": "a19", "title": "No-Screen Before Bed", "tags": ["sleep"], "minutes": 30},
    {"id": "a20", "title": "Progressive Muscle Relaxation", "tags": ["breathing", "therapy"], "minutes": 15},
    {"id": "a21", "title": "Watch a Funny Video", "tags": ["social", "mindfulness"], "minutes": 5},
    {"id": "a22", "title": "Deep Work Session", "tags": ["time_management"], "minutes": 50},
    {"id": "a23", "title": "Express Feelings Artistically", "tags": ["journaling", "therapy"], "minutes": 20},
    {"id": "a24", "title": "Call a Family Member", "tags": ["social"], "minutes": 10},
    {"id": "a25", "title": "Power Nap", "tags": ["sleep"], "minutes": 20},
]

# ... existing FIELD_TAG_MAP ...

# ... existing _tags_to_vector ...

# ... existing _cosine_sim ...

# ... existing Recommender class init ...

# ... existing log_interaction ...

# ... existing _load_popularity ...

# ... (Keep existing imports and activity catalog)

# EDOS Emotion Mapping to Tags
EMOTION_TAG_MAP = {
    "angry": ["breathing", "mindfulness", "exercise"],
    "furious": ["breathing", "exercise"],
    "annoyed": ["breathing", "mindfulness"],
    "afraid": ["breathing", "therapy", "mindfulness"],
    "terrified": ["breathing", "therapy"],
    "anxious": ["breathing", "mindfulness"],
    "apprehensive": ["mindfulness"],
    "sad": ["journaling", "therapy", "social"],
    "lonely": ["social", "journaling"],
    "devastated": ["therapy", "journaling"],
    "disappointed": ["journaling", "mindfulness"],
    "joyful": ["social", "exercise"],
    "excited": ["social", "exercise"],
    "happy": ["social", "exercise"],
    "content": ["mindfulness", "journaling"],
    "grateful": ["journaling"],
    "proud": ["social", "journaling"],
    "confident": ["social", "time_management"],
    "faithful": ["mindfulness", "social"],
    "trusting": ["social"],
    "jealous": ["journaling", "mindfulness"],
    "ashamed": ["journaling", "therapy"],
    "guilty": ["journaling", "therapy"],
    "disgusted": ["breathing"],
    "surprised": ["mindfulness"],
    "nostalgic": ["journaling", "social"],
    "sentimental": ["journaling"],
    "hopeful": ["time_management", "journaling"],
    "prepared": ["time_management"],
    "anticipating": ["time_management"],
    "caring": ["social"],
    "impressed": ["social"]
}

# ... (Keep FIELD_TAG_MAP)

# ... (Keep _tags_to_vector, _cosine_sim, Recommender init, log_interaction, _load_popularity)

    def _build_user_vector(self, user_metrics, sentiment_label):
        # Start with zero tag weights
        vec = [0.0] * len(TAG_LIST)
        
        # Check if metrics are effectively empty/default to boost sentiment influence
        has_metrics = any(float(user_metrics.get(k, 0)) > 0 for k in user_metrics)
        sentiment_boost = 2.0 if not has_metrics else 1.2

        # Incorporate numeric field mappings
        for field, mapping in FIELD_TAG_MAP.items():
            if field in user_metrics:
                try:
                    val = float(user_metrics[field])
                except Exception:
                    val = 0.0
                if val > 20:
                    val = val / (val + 10)
                else:
                    val = val / 10.0
                for tag, w in mapping.items():
                    if tag in TAG_LIST:
                        vec[TAG_LIST.index(tag)] += w * val

        # Handle Fine-Grained Emotions (EDOS) if present
        label_lower = sentiment_label.lower()
        if label_lower in EMOTION_TAG_MAP:
             for tag in EMOTION_TAG_MAP[label_lower]:
                 if tag in TAG_LIST:
                     vec[TAG_LIST.index(tag)] += (1.0 * sentiment_boost)
        
        # Fallback to old VADER labels if not found in EDOS map
        elif sentiment_label == "Negative":
            for t in ["therapy", "journaling", "social", "breathing"]:
                if t in TAG_LIST:
                    vec[TAG_LIST.index(t)] += (0.8 * sentiment_boost)
        elif sentiment_label == "Positive":
            for t in ["exercise", "time_management", "social"]:
                if t in TAG_LIST:
                    vec[TAG_LIST.index(t)] += (0.5 * sentiment_boost)
        
        # L2-normalize user vector
        norm = math.sqrt(sum(x*x for x in vec)) or 1e-9
        vec = [x / norm for x in vec]
        return vec

# Map numeric fields to tag weightings (adjust to your dataset)
FIELD_TAG_MAP = {
    # example mapping: field_name_in_dataset: {tag: weight}
    "sleep_quality": {"sleep": 1.0},
    "anxiety_level": {"mindfulness": 0.6, "breathing": 0.6, "therapy": 0.4},
    "depression": {"social": 0.5, "journaling": 0.6, "therapy": 0.6},
    "self_esteem": {"social": 0.3, "journaling": 0.2},
    "academic_performance": {"time_management": 0.6},
    "study_load": {"time_management": 0.6},
    "extracurricular_activities": {"social": 0.4, "exercise": 0.4},
    # Add other dataset fields as needed
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
        # Precompute item tag vectors
        self.items = ACTIVITY_CATALOG
        for it in self.items:
            it["tag_vector"] = _tags_to_vector(it["tags"])
        
        if interactions_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.interactions_path = os.path.join(base_dir, 'datasets', 'interactions.csv')
        else:
            self.interactions_path = interactions_path
            
        # Ensure directory exists for interactions
        os.makedirs(os.path.dirname(self.interactions_path), exist_ok=True)
            
        self.popularity = self._load_popularity()

    def log_interaction(self, user_id, item_id, feedback_score):
        """
        Logs a user interaction for adaptive learning.
        feedback_score: e.g. 1 for click/like, -1 for dislike
        """
        # Append to CSV
        file_exists = os.path.exists(self.interactions_path)
        try:
            with open(self.interactions_path, mode='a', newline='') as f:
                writer = csv.writer(f)
                # Optional: Write header if new file? 
                # typically interactions.csv: user_id,item_id,feedback
                if not file_exists:
                    writer.writerow(['user_id', 'item_id', 'feedback'])
                writer.writerow([user_id, item_id, feedback_score])
            
            # Update in-memory popularity immediately (Adaptive)
            self.popularity[item_id] += 1
        except Exception as e:
            print(f"Error logging interaction: {e}")

    def _load_popularity(self):
        # interactions.csv (optional): user_id,item_id,feedback (1 positive)
        if not os.path.exists(self.interactions_path):
            return Counter()
        pop = Counter()
        try:
            with open(self.interactions_path, newline="") as f:
                r = csv.reader(f)
                for row in r:
                    if len(row) < 2:
                        continue
                    item_id = row[1]
                    pop[item_id] += 1
        except Exception:
            return Counter()
        return pop

    def _build_user_vector(self, user_metrics, sentiment_label):
        # Start with zero tag weights
        vec = [0.0] * len(TAG_LIST)
        # Incorporate numeric field mappings
        for field, mapping in FIELD_TAG_MAP.items():
            if field in user_metrics:
                try:
                    val = float(user_metrics[field])
                except Exception:
                    val = 0.0
                # Normalize val roughly: assume typical scale 0-10 or 0-100; clamp
                if val > 20:
                    val = val / (val + 10)  # keep it bounded
                else:
                    val = val / 10.0
                for tag, w in mapping.items():
                    if tag in TAG_LIST:
                        vec[TAG_LIST.index(tag)] += w * val
        # Add sentiment influence: Negative -> prefer social/therapy/journaling more
        if sentiment_label == "Negative":
            for t in ["social", "therapy", "journaling"]:
                if t in TAG_LIST:
                    vec[TAG_LIST.index(t)] += 0.6
        elif sentiment_label == "Positive":
            # positive -> encourage exercise / time management
            for t in ["exercise", "time_management"]:
                if t in TAG_LIST:
                    vec[TAG_LIST.index(t)] += 0.3
        # L2-normalize user vector
        norm = math.sqrt(sum(x*x for x in vec)) or 1e-9
        vec = [x / norm for x in vec]
        return vec

    def recommend(self, user_metrics, sentiment_label, top_k=5):
        """
        Returns a list of recommended activities (dicts) ordered by relevance.
        """
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
                "id": it["id"],
                "title": it["title"],
                "tags": it["tags"],
                "minutes": it.get("minutes", None),
                "score": round(float(score), 4)
            })
        return results