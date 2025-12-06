import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Helper for random data generation if history is empty (MOCK DATA)
const generateMockHistory = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    steps: Math.floor(Math.random() * 5000) + 5000,
    water: Math.floor(Math.random() * 1000) + 1500,
    sleep: Math.floor(Math.random() * 3) + 6,
  }));
};

const PrivateProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});
  const [weeklyStats, setWeeklyStats] = useState(generateMockHistory());
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/profile/${username}`);
        if (response.data.success) {
          setProfile(response.data.profile);
          setUpdatedProfile(response.data.profile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    if (username) fetchProfile();
  }, [username]);

  const handleSave = async () => {
    try {
      const response = await axios.put(`http://localhost:8080/profile/${username}`, updatedProfile);
      if (response.data.success) {
        setProfile(updatedProfile);
        setEditing(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setUpdatedProfile((prev) => ({ ...prev, photo: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleStatChange = (type, value) => {
    setUpdatedProfile((prev) => ({
      ...prev,
      [type]: parseInt(value) || 0
    }));
  };

  if (!profile) return <div className="flex justify-center items-center h-screen text-[#33CEC5] animate-pulse">Loading Your Wellness Hub...</div>;

  return (
    <div className="font-sans text-dark">

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto mb-10 text-center"
      >
        <div className="relative inline-block group">
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#FFEC95] to-[#33CEC5] shadow-lg">
            <img
              src={updatedProfile.photo || profile.photo || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-full h-full object-cover rounded-full border-4 border-white"
            />
            {editing && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-xs font-bold">Change</span>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-xl animate-bounce">
            ✨
          </div>
        </div>

        <div className="mt-4">
          {editing ? (
            <input
              value={updatedProfile.name}
              onChange={(e) => setUpdatedProfile({ ...updatedProfile, name: e.target.value })}
              className="text-3xl font-bold text-center bg-transparent border-b-2 border-[#33CEC5] focus:outline-none"
            />
          ) : (
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#33CEC5] to-[#86D5F4]">
              {profile.name}
            </h1>
          )}
          <p className="text-gray-500 mt-1">{profile.university}</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 inline-block px-6 py-2 bg-white rounded-full shadow-sm text-sm border border-orange-100"
        >
          🌞 Today is a great day to take care of yourself, {profile.name.split(' ')[0]}!
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Col: Wellness Cards */}
        <div className="md:col-span-2 space-y-8">

          {/* Wellness Metrics Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Daily Goals</h3>
            <div className="flex gap-2">
              {editing ? (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-green-600 transition-all font-medium text-sm"
                >
                  <span>✓</span> Save
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 bg-white text-[#33CEC5] border border-[#33CEC5] px-4 py-2 rounded-full shadow-sm hover:bg-[#33CEC5] hover:text-white transition-all font-medium text-sm"
                >
                  <span>✎</span> Update
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Steps Card */}
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f0f0] relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-[#86D5F4]/20 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🦶</span>
                <h3 className="font-semibold text-gray-700">Steps</h3>
              </div>
              <div className="relative pt-2">
                <div className="flex justify-between mb-1 text-xs font-medium text-gray-500">
                  {editing ? (
                    <input
                      type="number"
                      value={updatedProfile.steps || 0}
                      onChange={(e) => handleStatChange('steps', e.target.value)}
                      className="w-20 border rounded px-1 bg-gray-50 focus:ring-2 focus:ring-[#86D5F4] outline-none"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-800">{profile.steps || 0}</span>
                  )}
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={updatedProfile.stepGoal || 10000}
                        onChange={(e) => handleStatChange('stepGoal', e.target.value)}
                        className="w-20 border rounded px-1 bg-gray-50 focus:ring-2 focus:ring-[#86D5F4] outline-none text-right"
                      />
                      <span className="text-xs">Goal</span>
                    </div>
                  ) : (
                    <span className="self-end">{profile.stepGoal || 10000} Goal</span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
                  <div className="bg-[#86D5F4] h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((updatedProfile.steps || profile.steps || 0) / (updatedProfile.stepGoal || profile.stepGoal || 10000)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </motion.div>

            {/* Water Card */}
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f0f0] relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-[#33CEC5]/20 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💧</span>
                <h3 className="font-semibold text-gray-700">Hydration</h3>
              </div>
              <div className="relative pt-2">
                <div className="flex justify-between mb-1 text-xs font-medium text-gray-500">
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={updatedProfile.water || 0}
                        onChange={(e) => handleStatChange('water', e.target.value)}
                        className="w-16 border rounded px-1 bg-gray-50 focus:ring-2 focus:ring-[#33CEC5] outline-none"
                      />
                      <span>ml</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-800">{profile.water || 0}ml</span>
                  )}
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={updatedProfile.waterGoal || 2500}
                        onChange={(e) => handleStatChange('waterGoal', e.target.value)}
                        className="w-16 border rounded px-1 bg-gray-50 focus:ring-2 focus:ring-[#33CEC5] outline-none text-right"
                      />
                      <span className="text-xs">Goal</span>
                    </div>
                  ) : (
                    <span className="self-end">{profile.waterGoal || 2500}ml Goal</span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
                  <div className="bg-[#33CEC5] h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((updatedProfile.water || profile.water || 0) / (updatedProfile.waterGoal || profile.waterGoal || 2500)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </motion.div>

            {/* Sleep Card */}
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f0f0] relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-[#FFEC95]/40 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌙</span>
                <h3 className="font-semibold text-gray-700">Sleep</h3>
              </div>
              <div className="relative pt-2">
                <div className="flex justify-between mb-1 text-xs font-medium text-gray-500">
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={updatedProfile.sleep || 0}
                        onChange={(e) => handleStatChange('sleep', e.target.value)}
                        className="w-16 border rounded px-1 bg-gray-50 focus:ring-2 focus:ring-[#FFEC95] outline-none"
                      />
                      <span>hrs</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-800">{profile.sleep || 0}h</span>
                  )}
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={updatedProfile.sleepGoal || 8}
                        onChange={(e) => handleStatChange('sleepGoal', e.target.value)}
                        className="w-16 border rounded px-1 bg-gray-50 focus:ring-2 focus:ring-[#FFEC95] outline-none text-right"
                      />
                      <span className="text-xs">Goal</span>
                    </div>
                  ) : (
                    <span className="self-end">{profile.sleepGoal || 8}h Goal</span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
                  <div className="bg-[#FFEC95] h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((updatedProfile.sleep || profile.sleep || 0) / (updatedProfile.sleepGoal || profile.sleepGoal || 8)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Weekly Summary Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-[#f0f0f0]"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-800">Weekly Progress</h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyStats.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="w-full bg-gray-100 rounded-t-xl relative group h-full flex items-end overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(day.steps / 12000) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="w-full bg-[#86D5F4] opacity-80 group-hover:opacity-100 transition-opacity"
                    ></motion.div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{day.day}</span>
                </div>
              ))}
            </div>
          </motion.div>



        </div>

        {/* Right Col: Personal & Mood */}
        <div className="space-y-8">

          {/* Wellness Streak */}
          <div className="bg-[#353535] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <h3 className="text-lg font-semibold mb-2">Wellness Streak 🔥</h3>
            <p className="text-4xl font-bold text-[#FFEC95]">{profile.streak || 0} Days</p>
            <p className="text-white/60 text-sm mt-1">You're doing amazing!</p>
          </div>

          {/* Personal Info Cards */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f0f0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">About You</h3>
              <button onClick={() => setEditing(!editing)} className="text-[#33CEC5] text-sm font-medium hover:underline">
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-500">Height</span>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={updatedProfile.height || ''}
                      onChange={(e) => setUpdatedProfile({ ...updatedProfile, height: e.target.value })}
                      className="w-12 bg-white border rounded text-center"
                    />
                    <span className="text-xs">cm</span>
                  </div>
                ) : (
                  <span className="font-bold">{profile.height || '--'} cm</span>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-500">Weight</span>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={updatedProfile.weight || ''}
                      onChange={(e) => setUpdatedProfile({ ...updatedProfile, weight: e.target.value })}
                      className="w-12 bg-white border rounded text-center"
                    />
                    <span className="text-xs">kg</span>
                  </div>
                ) : (
                  <span className="font-bold">{profile.weight || '--'} kg</span>
                )}
              </div>
            </div>

            {editing && (
              <button onClick={handleSave} className="w-full mt-4 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors">
                Save Changes
              </button>
            )}
          </div>

          {/* Mood Tracker */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f0f0]">
            <h3 className="font-bold text-gray-800 mb-4">How are you feeling?</h3>
            <div className="flex justify-between">
              {['Happy', 'Sad', 'Excited', 'Angry'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => {
                    setUpdatedProfile({ ...profile, mood });
                    // Ideally this saves immediately, but for now it updates visual selection
                  }}
                  className={`text-3xl p-3 rounded-2xl transition-all ${(updatedProfile.mood || profile.mood) === mood
                    ? 'bg-[#FFEC95] scale-110 shadow-md'
                    : 'hover:bg-gray-100 grayscale hover:grayscale-0'
                    }`}
                  title={mood}
                >
                  {mood === 'Happy' && '😊'}
                  {mood === 'Sad' && '😔'}
                  {mood === 'Excited' && '🤩'}
                  {mood === 'Angry' && '😤'}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-[#86D5F4]/10 p-6 rounded-3xl border border-[#86D5F4]/20">
            <h3 className="font-bold text-[#353535] mb-4 flex items-center gap-2">
              <span>💡</span> Suggestions
            </h3>
            <ul className="space-y-3">
              {profile.suggestions && profile.suggestions.length > 0 ? (
                profile.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-white/50 p-2 rounded-lg">
                    <span className="text-[#33CEC5] mt-1">●</span>
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">Log your mood to see suggestions!</li>
              )}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrivateProfile;

