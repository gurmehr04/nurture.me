const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs"); // Import bcryptjs
require("dotenv").config();



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
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/userdata";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  university: { type: String, required: true },
  course: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  consent: { type: Boolean, default: false }, // User consent for data usage
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
  streak: { type: Number, default: 0 },
  wins: { type: [String], default: [] },
  stepGoal: { type: Number, default: 10000 },
  waterGoal: { type: Number, default: 2500 },
  sleepGoal: { type: Number, default: 8 },
  history: {
    type: [
      {
        date: { type: String }, // Format: YYYY-MM-DD
        steps: { type: Number, default: 0 },
        water: { type: Number, default: 0 },
        sleep: { type: Number, default: 0 }
      }
    ],
    default: []
  }
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
    socket.emit("active_chats", activeChats);
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
    const { name, university, photo, height, weight, mood, habits, steps, water, sleep, stepGoal, waterGoal, sleepGoal } = req.body;

    // Validate mood
    if (mood && !moodSuggestions[mood]) {
      return res.status(400).json({ success: false, message: "Invalid mood" });
    }

    // CHECK CONSENT: Fetch user to verify consent before saving sensitive/mood data
    const userUser = await User.findOne({ username });
    if (!userUser) return res.status(404).json({ success: false, message: "User not found" });

    // If user has NOT given consent, we restrict what we save.
    // We allow basic profile updates (name, photo) but DO NOT update mood/history.
    let updatePayload = {
      name,
      university,
      photo,
      height,
      weight,
      stepGoal,
      waterGoal,
      sleepGoal
    };

    const hasConsent = userUser.consent === true;

    if (hasConsent) {
      // ONLY if consent is true, we update mood-related fields
      updatePayload = {
        ...updatePayload,
        mood,
        habits,
        suggestions: moodSuggestions[mood] || [],
        steps,
        water,
        sleep
      };
    } else {
      // If no consent, ensure we don't accidentally overwrite strict fields
      // Or arguably, we just ignore the mood inputs.
      // The requirement: "If consent === false, Do NOT store any mood logs"
      console.log(`[Privacy] Skiping mood storage for ${username} (No Consent)`);
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { username },
      updatePayload,
      { new: true, upsert: true } // Upsert ensures a new profile is created if it doesn't exist
    );

    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

// Improve error handling for GET profile
// Improve error handling for GET profile and Sync with User Data
app.get("/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Fetch both Profile and User to sync data
    const userMap = await User.findOne({ username });
    let profile = await Profile.findOne({ username });

    if (!userMap) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!profile) {
      // Create a new profile if it doesn't exist, using User data
      profile = new Profile({
        username,
        name: userMap.name,
        university: userMap.university,
        photo: "https://via.placeholder.com/150",
        height: null,
        weight: null,
        mood: "Happy",
        habits: [],
        suggestions: moodSuggestions["Happy"],
      });
      await profile.save();
    } else {
      // Sync vital fields from User to Profile (Source of Truth)
      if (profile.name !== userMap.name || profile.university !== userMap.university) {
        profile.name = userMap.name;
        profile.university = userMap.university;
        await profile.save();
      }
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
app.post("/register", async (req, res) => {
  const { username, email, phone, password, name, university, age, course, consent } = req.body;

  try {
    // Check if username OR email already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.json("exist");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      name,
      university,
      age,
      university,
      age,
      course,
      consent: consent === true // Enforce boolean
    });
    await newUser.save();
    return res.json("nonexist");
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error (likely username or email if the explicit check failed somehow, or race condition)
      return res.json("exist");
    }
    console.error("Error inserting data:", error);
    return res.status(500).json("Error saving user");
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return res.json({ status: "failure" });
    }

    // Check if password matches (bcrypt)
    let isMatch = await bcrypt.compare(password, existingUser.password);

    // Legacy Fallback: Check if plain text matches (Lazy Migration)
    if (!isMatch && existingUser.password === password) {
      console.log(`Migrating password for user: ${username}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      isMatch = true;
    }

    if (isMatch) {
      return res.json({ status: "success", isAdmin: existingUser.isAdmin, consent: existingUser.consent });
    } else {
      return res.json({ status: "failure" });
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

// Seed Admin User
app.post("/seedAdmin", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingAdmin = await User.findOne({ username });
    if (existingAdmin) return res.status(400).json({ message: "Admin already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      username,
      password: hashedPassword,
      email,
      phone: "0000000000",
      name: "Admin",
      university: "N/A",
      age: 0,
      course: "N/A",
      isAdmin: true,
    });

    await newAdmin.save();
    res.json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ success: false, message: "Error creating admin" });
  }
});

// Start the server
server.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
  console.log("WebSocket server running with Socket.IO");
});
