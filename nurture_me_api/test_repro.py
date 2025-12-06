import requests
import json

payload = {"text": "i feel good"}

def test(port):
    url = f"http://localhost:{port}/predict/text-sentiment"
    print(f"--- Testing Port {port} ---")
    try:
        res = requests.post(url, json=payload, timeout=2)
        print("Status:", res.status_code)
        if res.status_code == 200:
            print("Response:", json.dumps(res.json(), indent=2))
        else:
            print("Error Response:", res.text[:200])
            # Check if it's node HTML
            if "<html" in res.text:
                print("-> Detection: Likely Node.js/Express (HTML 404)")
            else:
                 print(f"-> Detection: Python/FastAPI (JSON {res.status_code})")
    except Exception as e:
        print(f"Connection failed: {e}")

test(8000)
test(8080)
test(8081)
