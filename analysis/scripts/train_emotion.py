import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

def train_emotion_model():
    print("--- Loading EDOS Dataset (Subset) ---")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'datasets', 'EDOS_1M.csv')

    # Load only 50k rows to save memory/time
    df = pd.read_csv(dataset_path, nrows=50000)
    
    # Columns of interest: 'text' and 'ed_dialog_emotion'
    # Check for missing
    df = df[['text', 'ed_dialog_emotion']].dropna()
    
    # Target distribution check
    print("Emotion Distribution:")
    print(df['ed_dialog_emotion'].value_counts())

    X = df['text']
    y = df['ed_dialog_emotion']

    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("--- Training TF-IDF + Logistic Regression Model ---")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)),
        ('clf', LogisticRegression(max_iter=1000, multi_class='ovr'))
    ])

    pipeline.fit(X_train, y_train)

    print("--- Evaluating ---")
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Save
    model_path = os.path.join(base_dir, 'emotion_model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_emotion_model()
