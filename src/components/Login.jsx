import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../context/UserContext";

const Login = () => {
  const { login } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // State for error messages
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8080/login", {
        username,
        password,
      });

      if (res.data.status === "success") {
        const userData = {
          username: username,
          isAdmin: res.data.isAdmin || false,
          consent: res.data.consent || false
        };
        login(userData); // Save full user object
        localStorage.setItem("username", username); // Keep legacy string for safety if needed
        setUsername(""); // Clear the input fields
        setPassword("");
        setErrorMessage(""); // Clear any previous error messages
        navigate("/forum");
      } else {
        setErrorMessage("Invalid username or password. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };

  return (
    <section className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-8 transform transition-all hover:scale-[1.01]">
        <h2 className="text-4xl font-bold text-center text-dark mb-8">Welcome Back</h2>

        {errorMessage && (
          <div className="bg-red-50 text-red-500 text-center p-3 rounded-lg mb-6 text-sm border border-red-100">
            {errorMessage}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-2">
            <label htmlFor="username" className="text-sm font-semibold text-gray-600 ml-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-600 ml-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-primary to-yellow-300 text-dark font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 mt-4"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Don't have an account? <span className="text-teal-500 font-bold cursor-pointer hover:underline" onClick={() => navigate('/register')}>Sign Up</span>
        </p>
      </div>
    </section>
  );
};

export default Login;
