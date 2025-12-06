# Nurture.Me

A holistic wellness platform combining mental health support, personalized recommendations, and community engagement.

## 🚀 Getting Started

### Backend Setup (Python / FastAPI)

1.  **Navigate to the backend directory:**
    ```powershell
    cd nurture_me_api
    ```

2.  **Activate the Virtual Environment** (Crucial Step):
    ```powershell
    .\.venv311\Scripts\Activate.ps1
    ```
    *You should see `(.venv311)` appear at the start of your command line.*

3.  **Start the Server:**
    ```powershell
    python -m uvicorn app.main:app --reload --port 8000
    ```

### Frontend Setup (React / Vite)

1.  **Navigate to the project root:**
    ```powershell
    cd nurture.me
    ```

2.  **Install dependencies:**
    ```powershell
    npm install
    ```

3.  **Start the development server:**
    ```powershell
    npm run dev
    ```

## 🧠 Model Training (Optional)
To "Initiate" (Train) the Model from Scratch:

1.  **Navigate to the scripts folder:**
    ```powershell
    cd analysis/scripts
    ```

2.  **Run the training script:**
    ```powershell
    python train_model.py
    ```
    *This will generate new `stress_model.pkl` and `scaler.pkl` files.*
