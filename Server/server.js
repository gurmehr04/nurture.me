const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/userData", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
});

// Define the Question Schema
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  username: { type: String, required: true },
  answers: [
    {
      username: { type: String, required: true },
      answer: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  type: { type: String, required: true, enum: ["FAQ", "User"], default: "FAQ" },
  timestamp: { type: Date, default: Date.now },
});

// Create the models
const User = mongoose.model("User", userSchema);
const Question = mongoose.model("Question", questionSchema);

// Define the Profile Schema
const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  university: { type: String, required: true },
  photo: { type: String, default: "https://via.placeholder.com/150" },
  height: { type: Number, required: false },
  weight: { type: Number, required: false },
  mood: { type: String, required: false, default: "Happy" }, // Default mood
  habits: { type: [String], required: false, default: [] },
  suggestions: { type: [String], required: false, default: [] },
});

// Create the Profile model
const Profile = mongoose.model("Profile", profileSchema);

// Create a default suggestion mapping for moods
const moodSuggestions = {
  Happy: ["Keep a gratitude journal", "Go for a walk in nature", "Plan a fun activity"],
  Sad: ["Talk to a trusted friend", "Write your feelings in a journal", "Watch a comforting movie"],
  Angry: ["Practice deep breathing", "Exercise to release tension", "Try a relaxation technique"],
  Excited: ["Set realistic goals", "Share your excitement with others", "Channel energy into a project"],
};

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Active chats and chat history
let activeChats = [];
const chatMessages = {};

// WebSocket Connection Handling
io.on("connection", (socket) => {
  const isAdmin = socket.handshake.query.isAdmin === "true";

  if (isAdmin) {
    console.log(`Admin connected: ${socket.id}`);
  } else {
    console.log(`User connected: ${socket.id}`);

    if (!activeChats.includes(socket.id)) {
      activeChats.push(socket.id);
      chatMessages[socket.id] = chatMessages[socket.id] || [];
      io.emit("active_chats", activeChats);
    }
  }

  socket.on("message", (msg) => {
    const { id, message, sender } = msg;

    if (!chatMessages[id]) chatMessages[id] = [];
    chatMessages[id].push(msg);

    if (sender === "admin") {
      io.to(id).emit("message", msg);
    } else {
      io.emit("message", msg);
    }
  });

  socket.on("fetch_chat", (chatId) => {
    const history = chatMessages[chatId] || [];
    socket.emit("chat_history", { chatId, history });
  });

  socket.on("disconnect", () => {
    if (!isAdmin) {
      console.log(`User disconnected: ${socket.id}`);
      activeChats = activeChats.filter((id) => id !== socket.id);
      io.emit("active_chats", activeChats);
    } else {
      console.log(`Admin disconnected: ${socket.id}`);
    }
  });
});


// Ensure default moods and suggestions are handled correctly in the PUT endpoint
app.put("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { name, university, photo, height, weight, mood, habits } = req.body;

    // Validate mood
    if (mood && !moodSuggestions[mood]) {
      return res.status(400).json({ success: false, message: "Invalid mood" });
    }

    const updatedSuggestions = moodSuggestions[mood] || [];
    const updatedProfile = await Profile.findOneAndUpdate(
      { username },
      {
        name,
        university,
        photo,
        height,
        weight,
        mood,
        habits,
        suggestions: updatedSuggestions,
      },
      { new: true, upsert: true } // Upsert ensures a new profile is created if it doesn't exist
    );

    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

// Improve error handling for GET profile
app.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const profile = await Profile.findOne({ username });

    if (!profile) {
      // Create a new profile if it doesn't exist
      const defaultProfile = new Profile({
        username,
        name: username, // Default name to username
        university: "Unknown University",
        photo: "https://via.placeholder.com/150",
        height: null,
        weight: null,
        mood: "Happy",
        habits: [],
        suggestions: moodSuggestions["Happy"], // Default to suggestions for "Happy"
      });

      await defaultProfile.save();
      return res.json({ success: true, profile: defaultProfile });
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
});

// Validate and sanitize inputs in saveQuestions endpoint
app.post("/saveQuestions", async (req, res) => {
  const { username, question, type } = req.body;

  try {
    if (!username || !question || !type) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const newQuestion = new Question({ username, question, type });
    await newQuestion.save();
    res.json({ success: true, newQuestionId: newQuestion._id });
  } catch (error) {
    console.error("Error saving question:", error);
    res.status(500).json({ success: false, message: "Error saving question" });
  }
});


// Seeding FAQs
app.post("/seedFAQs", async (req, res) => {
  const faqs = [
    { question: "How to reduce stress?", username: "FAQ", type: "FAQ" },
    { question: "Tips for better sleep?", username: "FAQ", type: "FAQ" },
    { question: "Managing anxiety?", username: "FAQ", type: "FAQ" },
    { question: "How to eat healthily?", username: "FAQ", type: "FAQ" },
    { question: "Best exercises for beginners?", username: "FAQ", type: "FAQ" },
    { question: "Staying hydrated tips?", username: "FAQ", type: "FAQ" },
  ];

  try {
    const existingFAQs = await Question.find({ type: "FAQ" });
    if (existingFAQs.length === 0) {
      await Question.insertMany(faqs);
      return res.json({ success: true, message: "FAQs added successfully" });
    }
    res.json({ success: true, message: "FAQs already exist" });
  } catch (error) {
    console.error("Error seeding FAQs:", error);
    res.status(500).json({ success: false, message: "Error seeding FAQs" });
  }
});

// Register
app.post("/Register", async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json("exist");
    }

    const newUser = new User({ username, email, phone, password });
    await newUser.save();
    return res.json("nonexist");
  } catch (error) {
    console.error("Error inserting data:", error);
    return res.status(500).json("Error saving user");
  }
});

// Login
app.post("/Login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username, password });

    if (existingUser) {
      return res.json("success");
    } else {
      return res.json("failure");
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json("Error during login");
  }
});

// Save Question
app.post("/saveQuestions", async (req, res) => {
  const { username, question, type } = req.body;

  try {
    const newQuestion = new Question({ username, question, type });
    await newQuestion.save();
    res.json({ success: true, newQuestionId: newQuestion._id });
  } catch (error) {
    console.error("Error saving question:", error);
    res.status(500).json({ success: false, message: "Error saving question" });
  }
});

// Add Answer
app.post("/addAnswer", async (req, res) => {
  const { questionId, username, answer } = req.body;

  try {
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    question.answers.push({ username, answer });
    await question.save();

    res.json({ success: true, message: "Answer added successfully" });
  } catch (error) {
    console.error("Error adding answer:", error);
    res.status(500).json({ success: false, message: "Error adding answer" });
  }
});

// Get Questions
app.get("/getQuestions", async (req, res) => {
  try {
    const questions = await Question.find().sort({ timestamp: -1 });
    res.json({ success: true, questions });
  } catch (error) {
    console.error("Error retrieving questions:", error);
    res.status(500).json({ success: false, message: "Error retrieving questions" });
  }
});

// Start the server
server.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
  console.log("WebSocket server running with Socket.IO");
});
