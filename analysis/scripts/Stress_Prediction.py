import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier  # <-- IMPORTED RandomForest
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')


def build_stress_model():
    """
    Complete pipeline to load, process, train, and evaluate
    a stress prediction model while preventing data leakage.

    This version uses a RandomForestClassifier for improved accuracy.
    """

    # 1. --- Load Data ---
    # Load the dataset you provided
    try:
        df = pd.read_csv('/Users/vaishnavidubey/Pycharm/analysis/datasets/StressLevelDataset.csv')
    except FileNotFoundError:
        print("Error: StressLevelDataset.csv not found.")
        print("Please make sure the file is in the same directory as this script.")
        return

    print(f"Successfully loaded data. Shape: {df.shape}\n")

    # 2. --- Define Features (X) and Target (y) ---
    # The target is what we want to predict
    y = df['stress_level']

    # The features are all other columns used for prediction
    X = df.drop('stress_level', axis=1)

    print(f"Target variable: 'stress_level' (Classes: {sorted(y.unique())})")
    print(f"Number of features: {X.shape[1]}\n")

    # 3. --- CRITICAL: Train-Test Split ---
    # THIS IS THE MOST IMPORTANT STEP TO PREVENT DATA LEAKAGE.
    # We split the *raw, unprocessed* data first. The model will
    # never see the X_test or y_test data during training.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,  # Use 20% of data for testing
        random_state=42,  # Ensures the split is reproducible
        stratify=y  # Ensures train/test sets have similar class distribution
    )

    print(f"Data split into training set ({X_train.shape[0]} samples) and test set ({X_test.shape[0]} samples).\n")

    # 4. --- Preprocessing (Scaling) - The *Correct* Way ---
    #
    # *** HOW WE PREVENT DATA LEAKAGE ***
    # We will fit the scaler (StandardScaler) *ONLY* on the training data (X_train).
    # This calculates the mean and standard deviation of *only* the training features.
    # We then use this *fitted* scaler to transform both X_train and X_test.
    #
    # Note: RandomForest is not sensitive to feature scaling,
    # but this is still good practice.

    scaler = StandardScaler()

    # Fit *ONLY* on training data
    scaler.fit(X_train)

    # Transform both training and test data
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Note: The outputs are numpy arrays, which is what the model expects
    print("Features have been scaled correctly without data leakage.\n")

    # 5. --- Train the Model ---
    # We'll use RandomForestClassifier, an ensemble model that often
    # provides higher accuracy by combining multiple "decision trees".

    print("Training the RandomForestClassifier model...")

    # n_estimators=100 means it will build 100 decision trees.
    # random_state=42 ensures we get reproducible results.
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    # We fit the model *ONLY* on the *scaled training data*.
    model.fit(X_train_scaled, y_train)

    print("Model training complete.\n")

    # 6. --- Evaluate the Model ---
    # Now, for the first time, we use our *scaled test data* (X_test_scaled)
    # to see how well the model performs on unseen data.

    print("--- Model Evaluation ---")
    y_pred = model.predict(X_test_scaled)

    # Calculate Accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy on Test Set: {accuracy * 100:.2f}%\n")

    # Classification Report
    # Shows precision, recall, and f1-score for each class (0, 1, 2)
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Stress Level 0', 'Stress Level 1', 'Stress Level 2']))

    # Confusion Matrix
    # Shows where the model got confused.
    # Rows are the *actual* classes, columns are the *predicted* classes.
    print("Confusion Matrix:")
    print(pd.DataFrame(
        confusion_matrix(y_test, y_pred),
        index=[f'Actual: {i}' for i in range(3)],
        columns=[f'Predicted: {i}' for i in range(3)]
    ))


# --- Run the entire pipeline ---
if __name__ == "__main__":
    build_stress_model()

