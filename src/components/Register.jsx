import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmojiCanvas } from './canvas';

const Register = () => {
    const navigate = useNavigate(); // Correctly using the useNavigate hook

    // State variables for form fields
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    // Form submission handler
    const submit = async (e) => {
        e.preventDefault(); // Prevent the default form submission

        try {
            // Sending a POST request to the backend
            const res = await axios.post("http://localhost:8080/Register", {
                username,
                email,
                phone,
                password,
            });

            if (res.data === "exist") {
                // User exists: Navigate to the forum page with the username in state
                navigate("/Forum", { state: { id: username } });
            } else if (res.data === "nonexist") {
                // New user: Show success message or navigate to a different page
                alert("Registration successful!");
                navigate("/Login");
            }
        } catch (error) {
            alert("Something went wrong. Please try again.");
            console.error("Error during registration:", error);
        }
    };

    return (
        <section className="flex items-center justify-center min-h-screen mt-12">
            <div className="outer flex flex-col md:flex-row items-center justify-center">
                {/* Registration Form */}
                <div className="section-registration flex-col p-6 md:p-8 ml-40 mb-10">
                    <h2 className="text-5xl font-bold mb-4 text-center text-gray-700 mb-20">Register</h2>
                    <form className="space-y-4" onSubmit={submit}>
                        {/* Username */}
                        <div className="flex flex-col">
                            <label
                                htmlFor="username"
                                className="text-sm font-medium text-gray-600"
                            >
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
    
                        {/* Email */}
                        <div className="flex flex-col">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-gray-600"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                            />
                        </div>
    
                        {/* Phone */}
                        <div className="flex flex-col">
                            <label
                                htmlFor="phone"
                                className="text-sm font-medium text-gray-600"
                            >
                                Phone Number
                            </label>
                            <input
                                type="text"
                                id="phone"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                            />
                        </div>
    
                        {/* Password */}
                        <div className="flex flex-col">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-gray-600"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                            />
                        </div>
    
                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
                        >
                            Register
                        </button>
                    </form>
                </div>
    
                {/* Canvas Section */}
                <div className="canvas-div w-[700px] h-[700px] flex-1 flex items-center justify-center p-4 md:p-6">
                    <EmojiCanvas />
                </div>
            </div>
        </section>
    );
    


};


export default Register;
