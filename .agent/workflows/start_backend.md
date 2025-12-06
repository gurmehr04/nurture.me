---
description: Start the Python Backend Server (FastAPI)
---

1. Open a terminal in the project root `nurture.me`.
2. Navigate to the API directory:
   ```powershell
   cd nurture_me_api
   ```
3. **CRITICAL**: Activate the virtual environment:
   ```powershell
   .\.venv311\Scripts\Activate.ps1
   ```
4. Install any missing dependencies (just in case):
   ```powershell
   pip install nltk uvicorn fastapi
   ```
   *(Note: You only need to do this once, but it's safe to run again)*

5. Start the server:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8080
   ```
