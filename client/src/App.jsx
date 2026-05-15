// src/App.jsx
import React, { useState } from 'react';
import ResultCard from './ResultCard';

function App() {
  const [jd, setJd] = useState('');
  const [topN, setTopN] = useState(3);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, topN }),
      });
      const data = await resp.json();
      setResults(data.matches || []);
    } catch (err) {
      console.error('Match request failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white mb-6">JD Matcher</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <label className="block mb-2 font-medium">Job Description</label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Paste the job description here"
        />
        <label className="block mb-2 font-medium">Top N results</label>
        <input
          type="number"
          value={topN}
          min={1}
          max={20}
          onChange={(e) => setTopN(parseInt(e.target.value, 10) || 1)}
          className="w-20 p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark transition"
        >
          {loading ? 'Matching...' : 'Find Candidates'}
        </button>
      </form>
      <div className="grid gap-6 w-full max-w-4xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <ResultCard key={r.studentId} result={r} />
        ))}
      </div>
    </div>
  );
}

export default App;
