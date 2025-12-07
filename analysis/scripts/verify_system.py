import requests
import json
import os
import time

# Configuration
BASE_URL = "http://localhost:8000"
ANALYZE_ENDPOINT = f"{BASE_URL}/analyze"
FEEDBACK_ENDPOINT = f"{BASE_URL}/feedback"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'

def print_pass(message):
    print(f"{GREEN}[PASS] {message}{RESET}")

def print_fail(message):
    print(f"{RED}[FAIL] {message}{RESET}")

def verify_risk_flag():
    print("\n--- Verifying Risk Flag (Safety) ---")
    payload = {
        "anxiety_level": 21, "self_esteem": 0, "mental_health_history": 1,
        "depression": 25, "headache": 5, "blood_pressure": 3, "sleep_quality": 0,
        "breathing_problem": 5, "noise_level": 5, "living_conditions": 1,
        "safety": 1, "basic_needs": 1, "academic_performance": 1,
        "study_load": 5, "teacher_student_relationship": 1,
        "future_career_concerns": 5, "social_support": 0, "peer_pressure": 5,
        "extracurricular_activities": 0, "bullying": 1,
        "journal_entry": "I feel hopeless and overwhelmed.",
        "consent": True
    }
    try:
        response = requests.post(ANALYZE_ENDPOINT, json=payload)
        if response.status_code == 200:
            data = response.json()
            if data.get("risk_flag") is True:
                print_pass("System correctly flagged high risk user.")
            else:
                print_fail(f"Risk flag expected True, got {data.get('risk_flag')}")
        else:
            print_fail(f"API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print_fail(f"Connection Error: {e}")

def verify_privacy_consent():
    print("\n--- Verifying Privacy Consent (Privacy) ---")
    payload = {
        "anxiety_level": 10, "self_esteem": 20, "mental_health_history": 0, 
        "depression": 5, "headache": 2, "blood_pressure": 2, "sleep_quality": 4, 
        "breathing_problem": 1, "noise_level": 2, "living_conditions": 3, 
        "safety": 3, "basic_needs": 4, "academic_performance": 4, 
        "study_load": 2, "teacher_student_relationship": 4, 
        "future_career_concerns": 2, "social_support": 3, "peer_pressure": 2, 
        "extracurricular_activities": 4, "bullying": 1,
        "journal_entry": "This should be ignored.",
        "consent": False
    }
    try:
        response = requests.post(ANALYZE_ENDPOINT, json=payload)
        if response.status_code == 200:
            data = response.json()
            if data.get("sentiment") == "Skipped" and "Consent not provided" in data.get("recommendation", ""):
                print_pass("System respected consent denial.")
            else:
                print_fail("System failed to respect consent denial.")
        else:
            print_fail(f"API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print_fail(f"Connection Error: {e}")

def verify_feedback_loop():
    print("\n--- Verifying Feedback Loop (Adaptive) ---")
    payload = {
        "user_id": "test_user_1",
        "item_id": "a1",
        "feedback": 5
    }
    try:
        response = requests.post(FEEDBACK_ENDPOINT, json=payload)
        if response.status_code == 200:
            print_pass("Feedback accepted successfully.")
        else:
            print_fail(f"API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print_fail(f"Connection Error: {e}")

def verify_storage():
    print("\n--- Verifying Data Storage (Persistence) ---")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    interactions_path = os.path.join(base_dir, 'datasets', 'interactions.csv')
    user_data_path = os.path.join(base_dir, 'datasets', 'new_user_data.csv')
    
    if os.path.exists(interactions_path):
        print_pass(f"Found interactions.csv at {interactions_path}")
    else:
        print_fail(f"Missing interactions.csv at {interactions_path}")
        
    if os.path.exists(user_data_path):
        print_pass(f"Found new_user_data.csv at {user_data_path}")
    else:
        print_fail(f"Missing new_user_data.csv at {user_data_path}")

if __name__ == "__main__":
    print("Starting System Verification...")
    verify_risk_flag()
    verify_privacy_consent()
    verify_feedback_loop()
    verify_storage()
