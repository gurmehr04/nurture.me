import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmojiCanvas } from './canvas';

const Register = () => {
    const navigate = useNavigate();

    // State variables for form fields
    const [formData, setFormData] = useState({
        username: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        university: "",
        age: "",
        course: "",
        consent: false
    });

    const handleChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.id]: val });
    };

    // Form submission handler
    const submit = async (e) => {
        e.preventDefault();

        try {
            // Sending a POST request to the backend
            const res = await axios.post("http://localhost:8080/register", formData);

            if (res.data === "exist") {
                alert("Username or Email already exists. Please try another.");
            } else if (res.data === "nonexist") {
                alert("Registration successful!");
                navigate("/login");
            }
        } catch (error) {
            alert("Something went wrong. Please try again.");
            console.error("Error during registration:", error);
        }
    };

    return (
        <section className="flex items-center justify-center min-h-[85vh] py-10">
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">

                {/* Registration Form */}
                <div className="w-full md:w-1/2 bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <h2 className="text-3xl font-bold mb-6 text-center text-dark relative z-10">Create Account</h2>
                    <form className="space-y-4 relative z-10" onSubmit={submit}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Name</label>
                                <input type="text" id="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                            </div>
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Username</label>
                                <input type="text" id="username" placeholder="Username" value={formData.username} onChange={handleChange} required
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Email</label>
                            <input type="email" id="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required
                                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Phone</label>
                                <input type="text" id="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                            </div>
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Age</label>
                                <input type="number" id="age" placeholder="Age" value={formData.age} onChange={handleChange} required
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">University</label>
                                <input type="text" id="university" placeholder="University" value={formData.university} onChange={handleChange} required
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                            </div>
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Major</label>
                                <input type="text" id="course" placeholder="Major" value={formData.course} onChange={handleChange} required
                                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Password</label>
                            <input type="password" id="password" placeholder="Password" value={formData.password} onChange={handleChange} required
                                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary/50 outline-none transition-all" />
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex items-start gap-3 mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <input
                                type="checkbox"
                                id="consent"
                                checked={formData.consent}
                                onChange={handleChange}
                                className="mt-1 w-5 h-5 text-secondary rounded focus:ring-secondary cursor-pointer"
                            />
                            <label htmlFor="consent" className="text-sm text-gray-600 leading-tight">
                                I consent to share my wellness data with Nurture.Me to improve insights and personalized suggestions.
                                <br /><span className="text-xs text-gray-400">(Unchecking this limits personalized features)</span>
                            </label>
                        </div>



                        <button type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-secondary to-teal-400 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-200 mt-6"
                        >
                            Create Account
                        </button>
                    </form>
                    <p className="text-center mt-6 text-gray-500 text-sm">
                        Already have an account? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>Login</span>
                    </p>
                </div>

                {/* Canvas Section */}
                <div className="hidden md:flex flex-1 items-center justify-center h-[500px]">
                    <EmojiCanvas />
                </div>
            </div>
        </section>
    );
};

export default Register;
