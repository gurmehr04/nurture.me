import axios from "axios";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useContext(UserContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("http://localhost:8080/Login", {
                username,
                password,
            });

            if (res.data.status === "success") {
                if (res.data.isAdmin) {
                    login(username); // Update user context
                    navigate("/Admin");
                } else {
                    alert("Access Denied: You are not an admin.");
                }
            } else {
                alert("Invalid credentials.");
            }
        } catch (error) {
            alert("Something went wrong. Please try again.");
            console.error("Error during login:", error);
        }
    };

    return (
        <section className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <h2 className="text-3xl font-bold mb-8 text-yellow-400 tracking-wider">ADMIN PORTAL</h2>
                <form className="space-y-6 w-full" onSubmit={submit}>
                    <div className="flex flex-col">
                        <label htmlFor="username" className="text-sm font-medium text-gray-400 mb-2">Username</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required
                            className="bg-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none border border-gray-600 focus:border-transparent transition-all" />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="password" className="text-sm font-medium text-gray-400 mb-2">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="bg-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none border border-gray-600 focus:border-transparent transition-all" />
                    </div>

                    <button type="submit"
                        className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-lg hover:bg-yellow-500 hover:scale-[1.02] transform transition-all duration-200"
                    >
                        ACCESS DASHBOARD
                    </button>
                </form>
            </div>
        </section>
    );
};

export default AdminLogin;
