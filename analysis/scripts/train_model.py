import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

def train_and_save_model():
    print("--- STEP 1: Loading Data ---")
    
    # Dynamic path handling
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'datasets', 'StressLevelDataset.csv')
    
    try:
        df = pd.read_csv(dataset_path)
    except FileNotFoundError:
        print(f"Error: StressLevelDataset.csv not found at {dataset_path}")
        return

    # Define Features (X) and Target (y)
    X = df.drop('stress_level', axis=1)
    y = df['stress_level']

    # Split data (80% training, 20% testing)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("--- STEP 2: Preprocessing ---")
    # Initialize and fit the scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print("--- STEP 3: Training Model ---")
    # Train Random Forest
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Stress', 'Medium Stress', 'High/Burnout']))

    print("--- STEP 4: Saving Artifacts ---")
    # Save the Model and the Scaler
    # We need the scaler later to format new user data exactly like the training data
    joblib.dump(model, 'stress_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Success! Model saved to 'stress_model.pkl' and Scaler to 'scaler.pkl'")

if __name__ == "__main__":
    train_and_save_model()