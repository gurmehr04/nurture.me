# Stress Detection and Habit Adherence Prediction Models
# For Nurture.Me - Real-time student wellness tracking

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, mean_squared_error, r2_score
import joblib
import warnings

warnings.filterwarnings('ignore')


class StressDetectionModel:
    """
    Predicts stress levels based on check-in data.
    Acts as an early warning system for student stress.
    """

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    def create_stress_features(self, df):
        """
        Create stress-related features from mental health data.
        """
        stress_indicators = []

        for _, row in df.iterrows():
            # Calculate stress score based on multiple factors
            stress_score = 0

            # High sadness increases stress
            if row['Sadness'] >= 3:
                stress_score += 2

            # Sleep disorder is a major stress indicator
            if row['Sleep dissorder'] >= 3:
                stress_score += 2

            # Exhaustion contributes to stress
            if row['Exhausted'] >= 3:
                stress_score += 2

            # Mood swings indicate stress
            if row['Mood Swing'] == 1:
                stress_score += 1

            # Overthinking is stress-related
            if row['Overthinking'] == 1:
                stress_score += 1

            # Nervous breakdown history
            if row['Nervous Break-down'] == 1:
                stress_score += 2

            # Low concentration indicates stress
            if row['Concentration'] <= 4:
                stress_score += 1

            # Low optimism suggests stress
            if row['Optimisim'] <= 4:
                stress_score += 1

            # Categorize stress level
            if stress_score <= 3:
                stress_level = 'Low'
            elif stress_score <= 6:
                stress_level = 'Medium'
            elif stress_score <= 9:
                stress_level = 'High'
            else:
                stress_level = 'Critical'

            stress_indicators.append({
                'stress_score': stress_score,
                'stress_level': stress_level
            })

        return pd.DataFrame(stress_indicators)

    def train(self, df_encoded):
        """
        Train the stress detection model.
        """
        print("\n" + "=" * 60)
        print("TRAINING STRESS DETECTION MODEL")
        print("=" * 60)

        # Create stress labels
        stress_df = self.create_stress_features(df_encoded)

        # Features for stress prediction
        feature_cols = ['Sadness', 'Exhausted', 'Sleep dissorder', 'Mood Swing',
                        'Nervous Break-down', 'Overthinking', 'Concentration', 'Optimisim']

        X = df_encoded[feature_cols]
        y = stress_df['stress_level']

        print(f"\nStress level distribution:")
        print(y.value_counts())

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42,
            class_weight='balanced'
        )

        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        y_pred = self.model.predict(X_test_scaled)

        print("\nStress Detection Model Performance:")
        print(classification_report(y_test, y_pred))

        # Save model
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'features': feature_cols
        }, 'stress_detection_model.pkl')

        print("\n✓ Stress detection model saved as 'stress_detection_model.pkl'")

        return self.model

    def predict_stress(self, patient_data):
        """
        Predict stress level for new check-in data.

        Args:
            patient_data (dict): A dictionary containing the required feature values.
        """
        df = pd.DataFrame([patient_data])
        df_scaled = self.scaler.transform(df)

        prediction = self.model.predict(df_scaled)[0]
        probabilities = self.model.predict_proba(df_scaled)[0]

        return {
            'stress_level': prediction,
            'probabilities': dict(zip(self.model.classes_, probabilities)),
            'risk_alert': prediction in ['High', 'Critical']
        }


class HabitAdherenceModel:
    """
    Predicts the likelihood of habit adherence/completion.
    This can be used for smart reminder scheduling.
    """

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()

    def create_adherence_score(self, df):
        """
        Create an adherence score based on behavioral patterns.
        """
        adherence_scores = []

        for _, row in df.iterrows():
            # Calculate adherence likelihood (0-10 scale)
            score = 5.0  # Base score

            # Positive factors
            if row['Admit Mistakes'] == 1:
                score += 1.5  # Self-awareness helps

            if row['Optimisim'] >= 6:
                score += 1.0  # Optimism increases adherence

            if row['Concentration'] >= 6:
                score += 1.0  # Good concentration helps

            if row['Ignore & Move-On'] == 0:
                score += 0.5  # Not ignoring issues

            # Negative factors
            if row['Nervous Break-down'] == 1:
                score -= 1.0  # Stress reduces adherence

            if row['Exhausted'] >= 3:
                score -= 1.0  # Exhaustion impacts compliance

            if row['Sleep dissorder'] >= 3:
                score -= 0.5  # Sleep issues affect routine

            if row['Overthinking'] == 1:
                score -= 0.5  # Overthinking can cause avoidance

            # Normalize to 0-10 range
            score = max(0, min(10, score))

            adherence_scores.append(score)

        return adherence_scores

    def train(self, df_encoded):
        """
        Train the habit adherence prediction model.
        """
        print("\n" + "=" * 60)
        print("TRAINING HABIT ADHERENCE MODEL")
        print("=" * 60)

        # Create adherence scores
        adherence_scores = self.create_adherence_score(df_encoded)

        # Features for adherence prediction
        feature_cols = ['Optimisim', 'Concentration', 'Admit Mistakes',
                        'Nervous Break-down', 'Exhausted', 'Sleep dissorder',
                        'Overthinking', 'Ignore & Move-On']

        X = df_encoded[feature_cols]
        y = np.array(adherence_scores)

        print(f"\nAdherence score statistics:")
        print(f"  Mean: {np.mean(y):.2f}")
        print(f"  Std: {np.std(y):.2f}")
        print(f"  Min: {np.min(y):.2f}")
        print(f"  Max: {np.max(y):.2f}")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model (using regression)
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )

        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        print("\nHabit Adherence Model Performance:")
        print(f"  Mean Squared Error: {mse:.4f}")
        print(f"  R² Score: {r2:.4f}")
        print(f"  RMSE: {np.sqrt(mse):.4f}")

        # Save model
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'features': feature_cols
        }, 'habit_adherence_model.pkl')

        print("\n✓ Habit adherence model saved as 'habit_adherence_model.pkl'")

        return self.model

    def predict_adherence(self, patient_data):
        """
        Predict adherence likelihood for a user.

        Args:
            patient_data (dict): A dictionary with required feature values.
        """
        df = pd.DataFrame([patient_data])
        df_scaled = self.scaler.transform(df)

        adherence_score = self.model.predict(df_scaled)[0]

        # Determine reminder frequency based on score
        if adherence_score >= 7:
            reminder_freq = 'Low'  # User is likely to follow through
            message = 'Keep up the great work!'
        elif adherence_score >= 5:
            reminder_freq = 'Medium'  # Moderate reminders needed
            message = 'Stay consistent with your goals!'
        else:
            reminder_freq = 'High'  # Needs frequent support
            message = 'We are here to support you!'

        return {
            'adherence_score': round(adherence_score, 2),
            'reminder_frequency': reminder_freq,
            'support_message': message,
            'needs_intervention': adherence_score < 4
        }


def train_all_models(csv_path):
    """
    Train all models: Stress Detection and Habit Adherence.
    """
    print("\n" + "=" * 70)
    print("NURTURE.ME - COMPLETE ML TRAINING PIPELINE")
    print("=" * 70)

    # Load data
    try:
        df = pd.read_csv(csv_path)
        print(f"\nLoaded {len(df)} patient records")
    except FileNotFoundError:
        print(f"Error: The file '{csv_path}' was not found. Please ensure it is in the correct directory.")
        return

    # Encode data
    frequency_mapping = {'Seldom': 1, 'Sometimes': 2, 'Usually': 3, 'Most-Often': 4}
    frequency_columns = ['Sadness', 'Euphoric', 'Exhausted', 'Sleep dissorder']

    for col in frequency_columns:
        df[col] = df[col].map(frequency_mapping)

    binary_columns = ['Mood Swing', 'Suicidal thoughts', 'Anorxia',
                      'Authority Respect', 'Try-Explanation', 'Aggressive Response',
                      'Ignore & Move-On', 'Nervous Break-down', 'Admit Mistakes',
                      'Overthinking']

    for col in binary_columns:
        df[col] = df[col].map({'YES': 1, 'NO': 0})

    rating_columns = ['Sexual Activity', 'Concentration', 'Optimisim']
    for col in rating_columns:
        df[col] = df[col].str.extract('(\d+)').astype(int)

    # Train Stress Detection Model
    stress_model = StressDetectionModel()
    stress_model.train(df)

    # Train Habit Adherence Model
    adherence_model = HabitAdherenceModel()
    adherence_model.train(df)

    print("\n" + "=" * 70)
    print("ALL MODELS TRAINED SUCCESSFULLY!")
    print("=" * 70)
    print("\nGenerated Model Files:")
    print("  1. stress_detection_model.pkl - Stress level detection")
    print("  2. habit_adherence_model.pkl - Habit adherence prediction")
    print("\nThese models are ready for integration into your application!")


# Example usage
if __name__ == "__main__":
    # Ensure you have a CSV file named 'mental_disorder.csv' in the same directory
    # or provide the correct path to your data file.
    csv_path = 'mental_disorder.csv'
    train_all_models(csv_path)

    # --- Example Predictions ---
    # This part will only run if the training is successful and models are saved.
    try:
        print("\n" + "=" * 70)
        print("EXAMPLE PREDICTIONS")
        print("=" * 70)

        # Load models
        stress_model_data = joblib.load('stress_detection_model.pkl')
        adherence_model_data = joblib.load('habit_adherence_model.pkl')

        stress_model = StressDetectionModel()
        stress_model.model = stress_model_data['model']
        stress_model.scaler = stress_model_data['scaler']
        stress_model.model.classes_ = stress_model_data['model'].classes_ # Ensure classes are loaded

        adherence_model = HabitAdherenceModel()
        adherence_model.model = adherence_model_data['model']
        adherence_model.scaler = adherence_model_data['scaler']

        # Example check-in data for a user experiencing high stress
        check_in_data = {
            'Sadness': 3,
            'Exhausted': 3,
            'Sleep dissorder': 4,
            'Mood Swing': 1,
            'Nervous Break-down': 1,
            'Overthinking': 1,
            'Concentration': 3,
            'Optimisim': 4,
            'Admit Mistakes': 1,
            'Ignore & Move-On': 0
        }

        print("\nCheck-in Data:", check_in_data)

        # Stress prediction
        stress_features = {k: check_in_data[k] for k in stress_model_data['features']}
        stress_result = stress_model.predict_stress(stress_features)

        print("\n📊 STRESS PREDICTION:")
        print(f"  Level: {stress_result['stress_level']}")
        print(f"  Risk Alert: {stress_result['risk_alert']}")
        print(f"  Probabilities: {stress_result['probabilities']}")

        # Adherence prediction
        adherence_features = {k: check_in_data[k] for k in adherence_model_data['features']}
        adherence_result = adherence_model.predict_adherence(adherence_features)

        print("\n📈 HABIT ADHERENCE PREDICTION:")
        print(f"  Score: {adherence_result['adherence_score']}/10")
        print(f"  Reminder Frequency: {adherence_result['reminder_frequency']}")
        print(f"  Support Message: '{adherence_result['support_message']}'")
        print(f"  Needs Intervention: {adherence_result['needs_intervention']}")

    except FileNotFoundError:
        print("\nCould not run example predictions because model files were not found.")
    except Exception as e:
        print(f"\nAn error occurred during the prediction phase: {e}")