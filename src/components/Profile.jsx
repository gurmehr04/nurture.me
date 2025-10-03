import React from "react";

const Profile = ({ name, university, bio, posts, followers, following, activities }) => {
  return (
    <div className="max-w-4xl mx-auto mt-28 p-6 bg-white shadow-md rounded-lg ">
      <div className="flex items-center space-x-6">
        {/* Profile Image */}
        <div className="w-32 h-32 bg-gray-300 rounded-full overflow-hidden border-4 border-[#86D5F4]">
          <img
            src="https://via.placeholder.com/150"
            alt=""
            className="object-cover w-full h-full"
          />
        </div>
        {/* Profile Info */}
        <div>
          <h1 className="text-3xl font-bold text-dark">{name}</h1>
          <p className="text-lg text-gray-600">{university}</p>
          <p className="text-[#86D5F4]">Mental & Physical Wellbeing Enthusiast</p>
        </div>
      </div>

      {/* Bio Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-dark">About Me</h2>
        <p className="mt-2 text-gray-700 leading-relaxed">{bio}</p>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <h3 className="text-2xl font-semibold text-dark">Posts</h3>
          <p className="mt-1 text-3xl font-bold text-yellow-500">{posts}</p>
        </div>
        <div className="bg-light-blue-100 p-4 rounded-lg text-center">
          <h3 className="text-2xl font-semibold text-dark">Followers</h3>
          <p className="mt-1 text-3xl font-bold text-light-blue-500">{followers}</p>
        </div>
        <div className="bg-teal-100 p-4 rounded-lg text-center">
          <h3 className="text-2xl font-semibold text-dark">Following</h3>
          <p className="mt-1 text-3xl font-bold text-teal-500">{following}</p>
        </div>
      </div>

      {/* Activity Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-dark">Recent Activities</h2>
        <ul className="mt-4 space-y-3">
          {activities.map((activity, index) => (
            <li key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm">
              <p className="text-dark">{activity.description}</p>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
