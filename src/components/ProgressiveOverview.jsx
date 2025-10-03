import React, { useState } from "react";
import StatCard from "./StatCard"; // Assuming StatCard is in the same folder

const ProgressiveOverview = () => {
  const [stats, setStats] = useState([
    { label: "Distance Walked", value: "15", goal: "20", unit: "km", icon: "🚶‍♂️" },
    { label: "Water Intake", value: "2.5", goal: "3.5", unit: "L", icon: "💧" },
    { label: "Sleep Hours", value: "7", goal: "8", unit: "hrs", icon: "🛌" },
  ]);

  const handleGoalChange = (index, newGoal) => {
    const updatedStats = [...stats];
    updatedStats[index].goal = newGoal;
    setStats(updatedStats);
  };

  const handleValueChange = (index, newValue) => {
    const updatedStats = [...stats];
    updatedStats[index].value = newValue;
    setStats(updatedStats);
  };

  return (
    <div className="container mx-auto p-6 mb-12 mt-20">
      {/* Title */}
      <h1 className="text-5xl font-bold mb-8 text-center">Manage Your Progress</h1>

      {/* Stat Cards in a centered horizontal line */}
      <div className="flex justify-center space-x-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            goal={stat.goal}
            unit={stat.unit}
            onGoalChange={(newGoal) => handleGoalChange(index, newGoal)}
            onValueChange={(newValue) => handleValueChange(index, newValue)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressiveOverview;
