import React, { useState } from 'react';

const StatCard = ({ icon, label, value, goal, unit, onGoalChange, onValueChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(goal);
  const [newValue, setNewValue] = useState(value);

  // Calculate progress percentage (value/goal * 100), with a fallback for no goal set
  const progress = value && goal && !isNaN(value) && !isNaN(goal)
    ? Math.min((value / goal) * 100, 100) // cap at 100%
    : 0;

  const handleGoalChange = () => {
    onGoalChange(newGoal); // Update goal
    setIsEditing(false);
  };

  const handleValueChange = () => {
    onValueChange(newValue); // Update value
    setIsEditing(false);
  };

  const handleMoodChange = (event) => {
    setNewGoal(event.target.value);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
      <span className="text-4xl mb-4">{icon}</span>
      <p className="text-xl font-semibold">{label}</p>
      <p className="text-gray-500 mb-2">
        {value} {unit} / {goal} {unit}
      </p>

      {/* Editable Goal and Value */}
      {isEditing ? (
        <div className="flex flex-col items-center mb-2">
          <div className="flex items-center space-x-2">
            {/* Goal input */}
            <input
              type="number"
              className="border rounded-lg px-2 py-1 text-sm w-20"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
            />
            <span>{unit}</span>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            {/* Value input */}
            <button
              onClick={() => setNewValue(Math.max(0, newValue - 1))}
              className="px-2 py-1 bg-gray-300 rounded-lg text-sm"
            >
              ↓
            </button>
            <input
              type="number"
              className="border rounded-lg px-2 py-1 text-sm w-20"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button
              onClick={() => setNewValue(Math.min(newValue + 1, newGoal))}
              className="px-2 py-1 bg-gray-300 rounded-lg text-sm"
            >
              ↑
            </button>
          </div>

          <div className="flex items-center mt-2">
            <button onClick={handleGoalChange} className="ml-2 text-blue-500 text-sm">
              Save Goal
            </button>
            <button onClick={handleValueChange} className="ml-2 text-blue-500 text-sm">
              Save Value
            </button>
            <button onClick={() => setIsEditing(false)} className="ml-2 text-red-500 text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center mb-2">
          <p className="text-gray-500">{goal} {unit}</p>
          <button onClick={() => setIsEditing(true)} className="ml-2 text-blue-500 text-sm">
            Edit
          </button>
        </div>
      )}

      {/* Conditional Progress Bar */}
      {label !== 'Mood Overview' && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div
              className={`bg-blue-500 h-4 rounded-full transition-all duration-300 ease-in-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2 text-gray-500">{progress.toFixed(1)}% complete</p>
        </>
      )}
    </div>
  );
};

export default StatCard;
