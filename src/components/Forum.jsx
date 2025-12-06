import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { checkContent } from "../utils/moderation";

function Forum() {
  const { user } = useContext(UserContext);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username = user?.username || "Guest";

  // Predefined pastoral colors for cards
  const cardColors = [
    "bg-yellow-50 border-yellow-100",
    "bg-teal-50 border-teal-100",
    "bg-blue-50 border-blue-100",
    "bg-red-50 border-red-100",
    "bg-purple-50 border-purple-100"
  ];

  // Random tags generator
  const tags = ["Academics", "Stress", "Venting", "Relationships", "Wins", "Advice"];
  const getRandomTag = () => tags[Math.floor(Math.random() * tags.length)];
  const getRandomColor = (idx) => cardColors[idx % cardColors.length];

  // Fetch user questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get("http://localhost:8080/getQuestions");
        if (response.data.success) {
          setQuestions(response.data.questions || []);
        } else {
          setError("Failed to fetch questions.");
        }
      } catch (err) {
        setError("Failed to load questions.");
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Submit a new user question
  const handleNewQuestionSubmit = async () => {
    if (newQuestion.trim() === "") return;

    // Moderation Check
    const moderation = checkContent(newQuestion);
    if (!moderation.valid) {
      setError(moderation.warning);
      return;
    }
    setError(""); // Clear previous errors

    try {
      const response = await axios.post("http://localhost:8080/saveQuestions", {
        username,
        question: newQuestion,
        type: "User",
      });

      if (response.data.success) {
        setQuestions((prevQuestions) => [
          ...prevQuestions,
          { question: newQuestion, username, type: "User", answers: [] },
        ]);
        setNewQuestion("");
      } else {
        setError("Failed to save question.");
      }
    } catch (err) {
      setError("Failed to save question.");
      console.error("Error saving question:", err);
    }
  };

  // Add an answer to a question
  const handleAddAnswer = async (questionId, answerText) => {
    if (!answerText.trim()) return;

    // Moderation Check
    const moderation = checkContent(answerText);
    if (!moderation.valid) {
      setError(moderation.warning);
      return;
    }
    setError(""); // Clear previous errors

    try {
      const response = await axios.post("http://localhost:8080/addAnswer", {
        username,
        questionId,
        answer: answerText,
      });

      if (response.data.success) {
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) =>
            q._id === questionId
              ? { ...q, answers: [...q.answers, { username, answer: answerText }] }
              : q
          )
        );
      } else {
        setError("Failed to add answer.");
      }
    } catch (err) {
      setError("Failed to add answer.");
      console.error("Error adding answer:", err);
    }
  };

  // Hardcoded FAQs
  const faqs = [
    {
      question: "How to reduce stress?",
      answer:
        "Practice mindfulness, regular exercise, and maintain a balanced diet. Deep breathing exercises can also help.",
    },
    {
      question: "Tips for better sleep?",
      answer:
        "Maintain a consistent sleep schedule, limit screen time before bed, and create a relaxing bedtime routine.",
    },
    {
      question: "Managing anxiety?",
      answer:
        "Engage in regular physical activity, practice deep breathing, and consider speaking to a mental health professional.",
    },
    {
      question: "How to eat healthily?",
      answer:
        "Incorporate more fruits, vegetables, lean protein, and whole grains into your diet while reducing sugar and processed foods.",
    },
    {
      question: "Best exercises for beginners?",
      answer:
        "Start with low-impact exercises like walking, yoga, or swimming. Gradually include strength training and cardio.",
    },
    {
      question: "Staying hydrated tips?",
      answer:
        "Drink water throughout the day and carry a reusable water bottle. Include water-rich foods like cucumbers and oranges.",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-lg font-semibold text-red-500 mt-10">{error}</p>;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4">
          Community <span className="text-secondary">Forum</span>
        </h1>
        <p className="text-gray-500 text-lg">Hi <span className="text-primary font-bold">{username}</span>, share your thoughts or find answers.</p>
      </div>

      {/* FAQs Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
          <span className="text-2xl">❓</span>
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm shadow-card rounded-2xl p-6 hover:shadow-lg transition-all border border-white/50">
              <details className="group">
                <summary className="cursor-pointer text-dark font-semibold text-lg flex justify-between items-center list-none">
                  {faq.question}
                  <span className="transition group-open:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-secondary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed pl-1">{faq.answer}</p>
              </details>
            </div>
          ))}
        </div>
      </div>

      {/* Ask a Question Section */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl p-8 mb-16 border border-white/50 shadow-sm">
        <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
          <span>✏️</span> Ask the Community
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 px-6 py-4 bg-white border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all text-gray-700 placeholder-gray-400 shadow-sm"
          />
          <button
            onClick={handleNewQuestionSubmit}
            disabled={!newQuestion.trim()}
            className="bg-dark hover:bg-black text-white font-bold px-8 py-4 rounded-2xl shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            <span>Post</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Questions Section */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
          <span>💬</span> Recent Discussions
        </h2>
        <div className="space-y-6">
          {questions.filter((q) => q.type === "User").length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500">No community questions yet. Be the first to ask!</p>
            </div>
          ) : (
            questions
              .filter((q) => q.type === "User")
              .map((q, idx) => (
                <div key={q._id} className={`${getRandomColor(idx)} shadow-sm rounded-2xl p-6 border transition-transform hover:scale-[1.01]`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-dark">{q.question}</h3>
                    <span className="bg-white/60 text-xs px-3 py-1 rounded-full text-gray-600 font-medium border border-white/50">
                      {getRandomTag()}
                    </span>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4 mb-4 space-y-3">
                    {q.answers.length === 0 && <p className="text-xs text-gray-400 italic">No answers yet.</p>}
                    {q.answers.map((a, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-bold text-teal-600">{a.username}</span>
                        <span className="text-gray-700 ml-2">{a.answer}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write an answer..."
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          handleAddAnswer(q._id, e.target.value.trim());
                          e.target.value = "";
                        }
                      }}
                      id={`answer-input-${q._id}`}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`answer-input-${q._id}`);
                        if (input?.value.trim()) {
                          handleAddAnswer(q._id, input.value.trim());
                          input.value = "";
                        }
                      }}
                      className="bg-secondary text-white font-semibold px-6 py-2 rounded-xl text-sm hover:bg-teal-500 transition-colors shadow-sm"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Forum;
