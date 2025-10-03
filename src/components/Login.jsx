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
      const res = await axios.post("http://localhost:8080/Login", {
        username,
        password,
      });

      if (res.data === "success") {
        login({ username }); // Save user to context
        localStorage.setItem("username", username); // Store username in localStorage
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
    <section className="flex items-center justify-center min-h-screen mt-28">
      <div className="outer flex flex-col items-center justify-center">
        <div className="section-login flex-col md:p-8 mb-40">
          <h2 className="text-5xl font-bold text-center text-gray-700 mb-20">Login</h2>
          {errorMessage && (
            <div className="text-red-500 text-center mb-4">
              {errorMessage}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label htmlFor="username" className="text-sm font-medium text-gray-600">
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 w-[450px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="password" className="text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
