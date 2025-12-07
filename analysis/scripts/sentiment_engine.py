import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Download the lexicon (dictionary of words) only once
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon')

class SentimentEngine:
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()

    def analyze(self, text):
        """
        Input: User's journal text (string)
        Output: Dictionary with label ('Positive', 'Negative') and score.
        """
        if not text:
            return {"label": "Neutral", "score": 0.0}

        # Get polarity scores
        scores = self.sia.polarity_scores(text)
        compound_score = scores['compound']

        # Determine label based on compound score
        if compound_score >= 0.05:
            label = "Positive"
        elif compound_score <= -0.05:
            label = "Negative"
        else:
            label = "Neutral"

        return {
            "label": label,
            "score": compound_score,
            "raw_scores": scores
        }

# Quick Test
if __name__ == "__main__":
    engine = SentimentEngine()
    test_text = "I am feeling really overwhelmed and anxious about my exams."
    result = engine.analyze(test_text)
    print(f"Text: {test_text}")
    print(f"Result: {result}")