// src/ResultCard.jsx
import React from 'react';

function ResultCard({ result }) {
  const { name, score, reason } = result;
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{name}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-1">Score: <span className="font-bold">{score}%</span></p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{reason}</p>
    </div>
  );
}

export default ResultCard;
