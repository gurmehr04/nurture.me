import requests
import json

# URL of the running API
url = "http://localhost:8000/predict/wellness"

# Mock payload based on predict_wellness.py
payload = {
    "anxiety": 10, "esteem": 20, "history": 0, "depression": 5, 
    "headache": 2, "bp": 2, "sleep": 4, "breathing": 1, 
    "noise": 2, "living": 3, "safety": 3, "needs": 4, 
    "academic": 4, "load": 2, "teacher": 4, "career": 2, 
    "support": 3, "peer": 2, "extra": 4, "bullying": 1,
    "journal": "I had a pretty productive day today, feeling good!",
    "consent": True
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        print("Success! Response:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Failed with status {response.status_code}")
        print(response.text)
        
        # Try port 8080 if 8000 fails (user context says 8080 for node but uvicorn might be 8000)
        url8080 = "http://localhost:8080/predict/wellness" 
        print(f"Retrying on {url8080}...")
        response = requests.post(url8080, json=payload)
        if response.status_code == 200:
             print("Success on 8080! Response:")
             print(json.dumps(response.json(), indent=2))
        else:
             print(f"Failed on 8080 too: {response.text}")

except Exception as e:
    print(f"Error: {e}")
