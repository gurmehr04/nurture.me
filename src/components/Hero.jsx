import React, { useContext } from "react";
import { styles } from "../style";
import { EmojiCanvas } from "./canvas";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

import herobg from "../assets/hero-bg-grid.jpg";

const Hero = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const username = user?.username || "User";

  return (
    <>
      <section
        className="relative w-full h-[657px] mx-auto bg-cover bg-center mt-20"
        style={{ backgroundImage: `url(${herobg})` }}
      >
        <div
          className={`${styles.paddingX} absolute inset-0 top-[15px] max-w-7xl mx-auto flex items-start gap-5`}
        >
          <div className="flex flex-row justify-center items-start mt-5 gap-3">
            <div className="h-[500px] w-[800px] cursor-grab">
              <EmojiCanvas />
            </div>

            <div className="py-28 mx-14">
              <h1 className="font-black text-black text-[60px] mt-2 leading-tight">
                Hi, <span className="text-[#ffde20]">{username}</span>
                <br /> How are you doing today?
              </h1>
              {/* Show "Get Started" only if the user is not logged in */}
              {username === "User" && (
                <>
                  <h2 className="text-2xl font-bold text-gray-800 mt-[30px]">
                    Let's Get Started
                  </h2>
                  <div className="flex gap-4 mt-6">
                    <button
                      className="bg-yellow-400 w-[150px] text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition duration-200"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="bg-blue-600 text-white w-[150px] px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                      onClick={() => navigate("/register")}
                    >
                      Register
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
