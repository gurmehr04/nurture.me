import React, { useState, useEffect } from "react";
import axios from "axios";
import ProgressOverview from "./ProgressiveOverview"; // Import ProgressOverview

const moodSuggestions = {
  Happy: ["Keep a gratitude journal", "Go for a walk in nature", "Plan a fun activity"],
  Sad: ["Talk to a trusted friend", "Write your feelings in a journal", "Watch a comforting movie"],
  Angry: ["Practice deep breathing", "Exercise to release tension", "Try a relaxation technique"],
  Excited: ["Set realistic goals", "Share your excitement with others", "Channel energy into a project"],
};

const PrivateProfile = () => {
  const [profile, setProfile] = useState(null); // Store profile data
  const [editing, setEditing] = useState(false); // Toggle edit mode
  const [updatedProfile, setUpdatedProfile] = useState({}); // Store updated profile fields
  const [suggestions, setSuggestions] = useState([]); // Store mood-based suggestions
  const username = localStorage.getItem("username"); // Assume username is stored in localStorage after login

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/profile/${username}`);
        if (response.data.success) {
          setProfile(response.data.profile);
          setSuggestions(moodSuggestions[response.data.profile.mood]); // Set initial suggestions based on mood
        } else {
          console.error("Profile not found or error in response.");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    if (username) {
      fetchProfile();
    } else {
      console.error("Username is missing in localStorage.");
    }
  }, [username]);

  const handleEdit = () => {
    setEditing(true);
    setUpdatedProfile(profile); // Populate with current profile data
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`http://localhost:8080/profile/${username}`, updatedProfile);
      if (response.data.success) {
        setProfile(updatedProfile); // Update the UI with the saved profile
        setEditing(false); // Exit edit mode
      } else {
        console.error("Failed to save profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setUpdatedProfile((prev) => ({
        ...prev,
        photo: reader.result,
      }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleMoodChange = (e) => {
    const newMood = e.target.value;
    setUpdatedProfile((prev) => ({
      ...prev,
      mood: newMood,
    }));
    setSuggestions(moodSuggestions[newMood]); // Update suggestions based on mood
  };

  if (!profile) {
    return <p className="text-center mt-10 text-lg font-semibold">Loading profile...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto mt-20 p-6 bg-[#FFFFFF] shadow-lg rounded-lg border">
      {/* Profile Section */}
      <div className="flex justify-center items-center mb-8 space-x-6">
        {/* Profile Image and Name */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-[#86D5F4] rounded-full overflow-hidden border-4 border-[#33CEC5]">
            {editing ? (
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="border p-2"
              />
            ) : (
              <img
                src={profile.photo || "https://via.placeholder.com/150"}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            )}
          </div>

          <h1 className="text-3xl font-semibold text-[#353535]">
            {editing ? (
              <input
                type="text"
                name="name"
                value={updatedProfile.name || ""}
                onChange={handleChange}
                className="border rounded p-2 w-full text-center"
              />
            ) : (
              profile.name
            )}
          </h1>
          <p className="text-lg text-[#33CEC5] text-center">
            {editing ? (
              <input
                type="text"
                name="university"
                value={updatedProfile.university || ""}
                onChange={handleChange}
                className="border rounded p-2 w-full text-center"
              />
            ) : (
              profile.university
            )}
          </p>
        </div>
      </div>

      {/* Progress Overview Section */}
      <div className="flex justify-center space-x-6 mb-8">
        <ProgressOverview />
      </div>

      {/* Personal Information Section */}
      <h2 className="mt-6 text-2xl font-semibold text-[#353535]">Personal Information</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {["height", "weight"].map((field) => (
          <div key={field} className="p-4 bg-[#FFEC95] rounded-lg shadow-sm border border-[#E0E0E0]">
            <h3 className="text-lg font-semibold text-[#353535] capitalize">{field}</h3>
            {editing ? (
              <input
                type="text"
                name={field}
                value={updatedProfile[field] || ""}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              />
            ) : (
              <p className="text-xl text-[#353535]">
                {field === "height"
                  ? `${profile[field]} cm`
                  : field === "weight"
                  ? `${profile[field]} kg`
                  : profile[field]}
              </p>
            )}
          </div>
        ))}

        {/* Mood Section */}
        <div className="p-4 bg-[#FFEC95] rounded-lg shadow-sm border border-[#E0E0E0]">
          <h3 className="text-lg font-semibold text-[#353535]">Mood</h3>
          {editing ? (
            <select
              name="mood"
              value={updatedProfile.mood || ""}
              onChange={handleMoodChange}
              className="border rounded p-2 w-full"
            >
              <option value="Happy">Happy</option>
              <option value="Sad">Sad</option>
              <option value="Excited">Excited</option>
              <option value="Angry">Angry</option>
            </select>
          ) : (
            <p className="text-xl text-[#353535]">{profile.mood}</p>
          )}
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-[#353535]">Suggestions</h2>
        <ul className="mt-4 space-y-2">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="bg-[#86D5F4] p-4 rounded-lg shadow-sm border border-[#E0E0E0] text-[#353535]"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Edit and Save Buttons */}
      <div className="mt-6 flex justify-end gap-4">
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-green-500 text-white font-semibold px-6 py-2 rounded-lg"
            >
              Save
            </button>
          </>
        ) : (
          <button
            onClick={handleEdit}
            className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default PrivateProfile;
