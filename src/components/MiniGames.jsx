import React from 'react'
import BreathingTiles from './BreathingTiles'
import EndlessRunner from './EndlessRunner'
import ShooterGame from './ShooterGame'
import WorkoutWheel from './WorkoutWheel'

import game1 from '../assets/breathingtiles.png'
import game2 from '../assets/Workoutwheel.png'
import game3 from '../assets/positiverun.png'

const MiniGames = () => {
    return (
        <>
            <section className="mini-games">
                {/* First Game Section */}
                <div className="game flex flex-col md:flex-row gap-20 items-center justify-center md:items-start w-full mt-10">
                    <div className="game-sec flex-1">
                        <h2 className="font-black text-black text-[60px] mt-2 leading-tight">Breathing Tiles</h2>
                        <p className="text-gray-700 mb-6 text-center md:text-left text-lg mt-6">
                            The Breathing Exercise Game is a calming and interactive tool designed to support mental well-being and relaxation. Through guided breathing patterns, the game helps users focus on their breath, promoting mindfulness and reducing stress.
                            It's an excellent way to integrate mindful breathing into your daily routine, helping to enhance mental clarity and emotional resilience.
                        </p>
                        <div className="text-center md:text-left">
                            <BreathingTiles />
                        </div>
                    </div>
                    <div className="img-sec flex-1 flex justify-center mt-4">
                        <img src={game1} alt="Game Preview" className="w-full h-auto rounded-lg shadow-md" />
                    </div>
                </div>

                <div className="game flex flex-col md:flex-row gap-20 items-center justify-center md:items-start max-w-screen-xl mx-auto mt-36">
                    <div className="img-sec flex-1 flex justify-center mt-4">
                        <img src={game2} alt="Game Preview" className="w-full h-auto rounded-lg shadow-md" />
                    </div>

                    <div className="game-sec flex-1">
                        <h2 className="font-black text-black text-[60px] mt-2 leading-tight">Workout Wheel</h2>
                        <p className="text-gray-700 mb-6 text-center md:text-left text-lg mt-6">
                            The Workout Wheel Exercise Game is an engaging and dynamic way to promote physical health and activity. Spin the roulette wheel to receive a randomly assigned exercise challenge, designed to keep workouts fresh and exciting. Once an exercise is assigned, the game provides you with 60 seconds to perform it, encouraging quick action and focus.
                        </p>
                        <div className="text-center md:text-left">
                            <WorkoutWheel />
                        </div>
                    </div>
                </div>

                <div className="game flex flex-col md:flex-row gap-20 items-center justify-center md:items-start max-w-screen-xl mx-auto mt-36">
                    <div className="game-sec flex-1">
                        <h2 className="font-black text-black text-[60px] mt-2 leading-tight">Positivity Run</h2>
                        <p className="text-gray-700 mb-6 text-center md:text-left text-lg mt-6">
                            Positivity Run is an exhilarating endless runner game that challenges players to navigate a dynamic path, collecting green coins to boost their score while avoiding red coins to prevent penalties. Designed to be both fun and purposeful, the game sharpens reflexes, encourages focus, and trains players to make quick, mindful decisions. Positivity Run helps players develop attentiveness and decision-making skills that translate seamlessly into managing real-life challenges.
                        </p>
                        <div className="text-center md:text-left">
                            <EndlessRunner />
                        </div>
                    </div>
                    <div className="img-sec flex-1 flex justify-center mt-4">
                        <img src={game3} alt="Game Preview" className="w-full h-auto rounded-lg shadow-md" />
                    </div>
                </div>






                {/* Second Game Section */}
                <div className="game mt-28">
                    <div className="head-game text-center">
                        <h2 className='font-black text-black text-[60px] mt-2 leading-tight'>
                            Don't give up, You're almost there!
                        </h2>
                        <p className="text-gray-700 mb-6 text-lg mt-6 max-w-5xl mx-auto">
                            Emoji Blaster is a fun and uplifting game designed to brighten your mood and keep your spirits high! Take control of a spaceship and embark on a mission to shoot down the bad emojis (sad and angry faces) while letting the good ones (happy faces) stay.


                        </p>
                    </div>
                    <div className="game-sec">
                        <ShooterGame />
                    </div>
                </div>

            </section>
        </>
    );

}

export default MiniGames