#%%
# Mental Health Prediction ML Pipeline
# Complete implementation for Nurture.Me project

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.metrics import precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import warnings

warnings.filterwarnings('ignore')


class MentalHealthMLPipeline:
    """
    Complete ML pipeline for mental health diagnosis prediction
    """

    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.model = None
        self.feature_names = []

    def load_and_prepare_data(self, csv_path):
        """
        Load and prepare the mental health dataset
        """
        print("=" * 60)
        print("STEP 1: Loading and Preparing Data")
        print("=" * 60)

        # Load data
        df = pd.read_csv(csv_path)
        print(f"\nDataset shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")

        # Display first few rows
        print("\nFirst 5 rows:")
        print(df.head())

        # Check for missing values
        print("\nMissing values:")
        print(df.isnull().sum())

        return df

    def encode_features(self, df):
        """
        Encode categorical features to numerical
        """
        print("\n" + "=" * 60)
        print("STEP 2: Encoding Categorical Features")
        print("=" * 60)

        # Create a copy
        df_encoded = df.copy()

        # Define ordinal mappings for frequency-based features
        frequency_mapping = {
            'Seldom': 1,
            'Sometimes': 2,
            'Usually': 3,
            'Most-Often': 4
        }
        frequency_columns = ['Sadness', 'Euphoric', 'Exhausted', 'Sleep dissorder']
        for col in frequency_columns:
            if col in df_encoded.columns:
                df_encoded[col] = df_encoded[col].map(frequency_mapping)
                print(f"Encoded {col}: {frequency_mapping}")

        # Binary encoding for YES/NO columns
        binary_columns = ['Mood Swing', 'Suicidal thoughts', 'Anorxia',
                          'Authority Respect', 'Try-Explanation', 'Aggressive Response',
                          'Ignore & Move-On', 'Nervous Break-down', 'Admit Mistakes',
                          'Overthinking']
        for col in binary_columns:
            if col in df_encoded.columns:
                # <<< FIX IS HERE: Add this line to remove whitespace >>>
                df_encoded[col] = df_encoded[col].str.strip()
                df_encoded[col] = df_encoded[col].map({'YES': 1, 'NO': 0})

        # Extract numerical values from "X From 10" format
        rating_columns = ['Sexual Activity', 'Concentration', 'Optimisim']
        for col in rating_columns:
            if col in df_encoded.columns:
                df_encoded[col] = df_encoded[col].str.extract('(\d+)').astype(int)

        print("\nEncoded features sample:")
        print(df_encoded.head())

        return df_encoded

    def prepare_features_target(self, df_encoded):
        """
        Separate features and target variable
        """
        print("\n" + "=" * 60)
        print("STEP 3: Preparing Features and Target")
        print("=" * 60)

        # Drop Patient Number and target column
        X = df_encoded.drop(['Patient Number', 'Expert Diagnose'], axis=1)
        y = df_encoded['Expert Diagnose']

        self.feature_names = list(X.columns)

        print(f"\nFeatures shape: {X.shape}")
        print(f"Target shape: {y.shape}")
        print(f"\nFeature columns: {self.feature_names}")
        print(f"\nTarget distribution:")
        print(y.value_counts())

        return X, y

    def train_model(self, X, y):
        """
        Train multiple models and select the best one
        """
        print("\n" + "=" * 60)
        print("STEP 4: Training Machine Learning Models")
        print("=" * 60)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print(f"\nTraining set size: {X_train.shape[0]}")
        print(f"Testing set size: {X_test.shape[0]}")

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train multiple models
        models = {
            'Random Forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            ),
            'Gradient Boosting': GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                random_state=42
            )
        }

        best_score = 0
        best_model_name = None
        results = {}

        for name, model in models.items():
            print(f"\n{'*' * 40}")
            print(f"Training {name}...")
            print('*' * 40)

            # Train
            model.fit(X_train_scaled, y_train)

            # Predict
            y_pred = model.predict(X_test_scaled)

            # Evaluate
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')

            print(f"\nAccuracy: {accuracy:.4f}")
            print(f"Precision: {precision:.4f}")
            print(f"Recall: {recall:.4f}")
            print(f"F1 Score: {f1:.4f}")

            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'y_pred': y_pred
            }

            if f1 > best_score:
                best_score = f1
                best_model_name = name

        # Select best model
        self.model = results[best_model_name]['model']
        print(f"\n{'=' * 60}")
        print(f"BEST MODEL: {best_model_name} (F1 Score: {best_score:.4f})")
        print('=' * 60)

        return X_train_scaled, X_test_scaled, y_train, y_test, results[best_model_name]

    def evaluate_model(self, X_test, y_test, y_pred):
        """
        Detailed model evaluation with visualizations
        """
        print("\n" + "=" * 60)
        print("STEP 5: Model Evaluation and Visualization")
        print("=" * 60)

        # Classification Report
        print("\nDetailed Classification Report:")
        print(classification_report(y_test, y_pred))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)

        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig('confusion_matrix.png')
        print("\n✓ Confusion matrix saved as 'confusion_matrix.png'")

        # Feature Importance
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)

            print("\nTop 10 Important Features:")
            print(feature_importance.head(10))

            plt.figure(figsize=(10, 8))
            plt.barh(feature_importance['feature'].head(15),
                     feature_importance['importance'].head(15))
            plt.xlabel('Importance')
            plt.title('Top 15 Feature Importances')
            plt.tight_layout()
            plt.savefig('feature_importance.png')
            print("✓ Feature importance plot saved as 'feature_importance.png'")

    def save_model(self, filename='mental_health_model.pkl'):
        """
        Save the trained model and preprocessing objects
        """
        print("\n" + "=" * 60)
        print("STEP 6: Saving Model")
        print("=" * 60)

        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }

        joblib.dump(model_data, filename)
        print(f"\n✓ Model saved as '{filename}'")

    def predict_new_patient(self, patient_data):
        """
        Make prediction for a new patient

        Args:
            patient_data: Dictionary with patient features
        """
        print("\n" + "=" * 60)
        print("Making Prediction for New Patient")
        print("=" * 60)

        # Convert to DataFrame
        df_new = pd.DataFrame([patient_data])

        # Ensure correct order
        df_new = df_new[self.feature_names]

        # Scale
        df_scaled = self.scaler.transform(df_new)

        # Predict
        prediction = self.model.predict(df_scaled)[0]
        probabilities = self.model.predict_proba(df_scaled)[0]

        print(f"\nPredicted Diagnosis: {prediction}")
        print("\nProbabilities:")
        for i, label in enumerate(self.model.classes_):
            print(f"  {label}: {probabilities[i]:.4f}")

        return prediction, probabilities


def main():
    """
    Main execution function
    """
    print("\n" + "=" * 60)
    print("MENTAL HEALTH DIAGNOSIS ML PIPELINE")
    print("Nurture.Me Project")
    print("=" * 60)

    # Initialize pipeline
    pipeline = MentalHealthMLPipeline()

    # Step 1: Load data
    csv_path = 'mental_disorder.csv'  # Update with your CSV file path
    df = pipeline.load_and_prepare_data(csv_path)

    # Step 2: Encode features
    df_encoded = pipeline.encode_features(df)

    # Step 3: Prepare features and target
    X, y = pipeline.prepare_features_target(df_encoded)

    # Step 4: Train model
    X_train, X_test, y_train, y_test, best_results = pipeline.train_model(X, y)

    # Step 5: Evaluate model
    pipeline.evaluate_model(X_test, y_test, best_results['y_pred'])

    # Step 6: Save model
    pipeline.save_model('mental_health_model.pkl')

    # Example prediction
    print("\n" + "=" * 60)
    print("EXAMPLE PREDICTION")
    print("=" * 60)

    example_patient = {
        'Sadness': 3,  # Usually
        'Euphoric': 1,  # Seldom
        'Exhausted': 3,  # Usually
        'Sleep dissorder': 2,  # Sometimes
        'Mood Swing': 1,  # YES
        'Suicidal thoughts': 1,  # YES
        'Anorxia': 0,  # NO
        'Authority Respect': 0,  # NO
        'Try-Explanation': 1,  # YES
        'Aggressive Response': 0,  # NO
        'Ignore & Move-On': 0,  # NO
        'Nervous Break-down': 1,  # YES
        'Admit Mistakes': 1,  # YES
        'Overthinking': 1,  # YES
        'Sexual Activity': 3,
        'Concentration': 3,
        'Optimisim': 4
    }

    prediction, probabilities = pipeline.predict_new_patient(example_patient)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nGenerated Files:")
    print("  1. mental_health_model.pkl - Trained model")
    print("  2. confusion_matrix.png - Confusion matrix visualization")
    print("  3. feature_importance.png - Feature importance plot")


if __name__ == "__main__":
    main()