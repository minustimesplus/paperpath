import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import ScoreChart from '../components/ScoreChart';

const API_URL = 'https://papertrackerforib.onrender.com';

const ScoreAnalysis = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([
    // Group 1-6 subjects like in App.jsx
    // Abbreviated for brevity - this would be the same list as in App.jsx
    { id: 'english_a_sl', name: 'English A Lit SL', group: 1 },
    { id: 'math_aa_hl', name: 'Mathematics AA HL', group: 5 },
    // ...other subjects
  ]);
  const [completionData, setCompletionData] = useState({});
  const [scoreData, setScoreData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Fetch user's subjects and completion data
    Promise.all([
      axios.get(`${API_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/completion`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([subjectsResponse, completionResponse]) => {
        const userSubjects = subjectsResponse.data.subjects || [];
        setSubjects(userSubjects);
        
        if (userSubjects.length > 0) {
          setSelectedSubject(userSubjects[0]);
        }
        
        setCompletionData(completionResponse.data.completion || {});
        setScoreData(completionResponse.data.scores || {});
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load your data. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  const getScoreDataForChart = () => {
    if (!selectedSubject) return [];
    
    const scoreEntries = [];
    
    // Extract all scores for the selected subject
    Object.entries(scoreData).forEach(([key, score]) => {
      if (key.startsWith(selectedSubject)) {
        const [subjectId, year, session, paper] = key.split('-');
        if (subjectId === selectedSubject) {
          scoreEntries.push({
            year: parseInt(year),
            session,
            paper,
            score
          });
        }
      }
    });
    
    // Sort by year, then session, then paper
    return scoreEntries.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.session !== b.session) return a.session === 'May' ? -1 : 1;
      return a.paper.localeCompare(b.paper);
    });
  };

  const calculateSubjectStats = () => {
    if (!selectedSubject) return { min: 0, max: 0, avg: 0, count: 0 };
    
    const scores = [];
    
    Object.entries(scoreData).forEach(([key, score]) => {
      if (key.startsWith(selectedSubject + '-')) {
        scores.push(score);
      }
    });
    
    if (scores.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    
    return { min, max, avg, count: scores.length };
  };
  
  const stats = calculateSubjectStats();
  const chartData = getScoreDataForChart();

  if (loading) {
    return <div className="text-center py-4">Loading your score data...</div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Score Analysis</h2>
        <p className="text-gray-500">Please add subjects first to analyze scores.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Score Analysis</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Subject for Analysis
        </label>
        <select
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>
              {getSubjectName(subject)}
            </option>
          ))}
        </select>
      </div>
      
      {selectedSubject && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Score Statistics */}
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Score Statistics</h3>
              {stats.count > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">Average Score</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.avg}%</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">Highest Score</p>
                    <p className="text-2xl font-bold text-green-600">{stats.max}%</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">Lowest Score</p>
                    <p className="text-2xl font-bold text-red-600">{stats.min}%</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">Papers with Scores</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.count}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No scores recorded yet for this subject.</p>
              )}
            </div>
            
            {/* Score History Table */}
            <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Score History</h3>
              {chartData.length > 0 ? (
                <div className="overflow-y-auto max-h-60">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chartData.map((entry, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.year}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.session}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.paper}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{entry.score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No scores recorded yet for this subject.</p>
              )}
            </div>
          </div>
          
          {/* Score Chart */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Score Progression</h3>
            <ScoreChart scores={chartData} subject={getSubjectName(selectedSubject)} />
          </div>
          
          {/* Performance Analysis */}
          {stats.count >= 3 && (
            <div className="mt-8 p-4 bg-white shadow rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">Performance Analysis</h3>
              
              <div className="prose">
                <p className="mb-2">
                  {stats.avg >= 80 ? (
                    <span className="text-green-600 font-medium">Your performance in {getSubjectName(selectedSubject)} is excellent! You're consistently scoring high marks.</span>
                  ) : stats.avg >= 60 ? (
                    <span className="text-blue-600 font-medium">Your performance in {getSubjectName(selectedSubject)} is good. With some more practice, you could improve even further.</span>
                  ) : (
                    <span className="text-amber-600 font-medium">Consider focusing more on {getSubjectName(selectedSubject)}. Additional practice could help improve your scores.</span>
                  )}
                </p>
                
                {stats.max - stats.min > 30 && (
                  <p className="text-gray-600">
                    Your scores show significant variation (range of {stats.max - stats.min}%). Consistency might be an area to work on.
                  </p>
                )}
                
                {stats.count >= 5 && (
                  <p className="text-gray-600">
                    You've completed {stats.count} papers with scores - excellent preparation for your exams!
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScoreAnalysis;