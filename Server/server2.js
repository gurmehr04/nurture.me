const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); // For creating an HTTP server
const { Server } = require("socket.io"); // Importing Socket.IO

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust to your frontend URL
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
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define the User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
});

// Create the User model
const User = mongoose.model("User", userSchema);

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Adjust to your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Middleware
app.use(express.json()); // Parse JSON requests

// POST /Register endpoint
app.post("/Register", async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    // Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json("exist"); // User already exists
    }

    // Save the new user to the database
    const newUser = new User({
      username,
      email,
      phone,
      password, // Remember: Hash passwords for security in production
    });

    await newUser.save();
    return res.json("nonexist"); // New user created
  } catch (error) {
    console.error("Error inserting data:", error);
    return res.status(500).json("Error saving user");
  }
});

// POST /Login endpoint
app.post("/Login", async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Check if a user with the provided username and password exists
      const existingUser = await User.findOne({ username, password });
  
      if (existingUser) {
        return res.json("success"); // Login successful
      } else {
        return res.json("failure"); // Invalid credentials
      }
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json("Error during login");
    }
  });
  


// Start the server
server.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
  console.log("WebSocket server running with Socket.IO");
});
