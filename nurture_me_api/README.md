# Nurture.Me API

A minimal FastAPI wrapper around your ML models for Nurture.Me.

## Endpoints

- `GET /healthz` → health check
- `GET /meta/mental` → returns `feature_names` and categorical choices for the mental health model
- `POST /predict/mental-health` → JSON body with keys matching `feature_names`. You can send human-readable strings; the server encodes them to numeric using the original CSV.
- `POST /predict/stress` → `{"features":[...]}` numeric vector
- `POST /predict/habit` → `{"features":[...]}` numeric vector

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./run.sh
```

Open http://localhost:8000/docs for Swagger UI.

.\.venv311\Scripts\Activate.ps1
