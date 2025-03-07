import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTimezoneConfig } from '../contexts/TimezoneContext';
import { getSubjectName } from '../config/subjectConfig';
import axios from 'axios';

const API_URL = 'https://papertrackerforib.onrender.com';

const years = [2019, 2020, 2021, 2022, 2023, 2024];
const sessions = ['May', 'November'];
const timezones = ['TZ1', 'TZ2'];

// Available subjects configuration (same as in SubjectSelection)
const availableSubjects = [
  // Group 1: Studies in Language and Literature
  { id: 'english_a_literature_sl', name: 'English A Literature SL', group: 1 },
  { id: 'english_a_literature_hl', name: 'English A Literature HL', group: 1 },
  // ...rest of available subjects...
];

const PaperTracking = () => {
  const { token, currentUser, localCompletionStatus, setLocalCompletionStatus, localSubjects } = useAuth();
  const { tzConfig, loading: tzLoading } = useTimezoneConfig();
  const [subjects, setSubjects] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [scoreDialog, setScoreDialog] = useState({ isOpen: false, paperInfo: null, tempScore: '' });

  // Toggle row expansion
  const toggleRowExpansion = (rowKey) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };
  
  // Check if selected subject has any papers with TZ variants
  const subjectHasAnyTZVariants = selectedSubject ? 
    Object.values(tzConfig[selectedSubject] || {}).some(hasTZ => hasTZ === true) : 
    false;

  useEffect(() => {
    if (currentUser) {
      // Fetch from server if logged in
      Promise.all([
        axios.get(`${API_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/completion`, { headers: { Authorization: `Bearer ${token}` } })
      ])
        .then(([subjectsResponse, completionResponse]) => {
          setSubjects(subjectsResponse.data.subjects || []);
          setCompletionStatus(completionResponse.data || {});
          if (subjectsResponse.data.subjects && subjectsResponse.data.subjects.length > 0) {
            setSelectedSubject(subjectsResponse.data.subjects[0]);
          }
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setError('Failed to load your data. Please try again later.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Use local storage for anonymous users
      setSubjects(localSubjects);
      setCompletionStatus(localCompletionStatus);
      if (localSubjects.length > 0) {
        setSelectedSubject(localSubjects[0]);
      }
      setLoading(false);
    }
  }, [token, currentUser, localSubjects, localCompletionStatus]);

  const updatePaperStatus = (subject, year, session, paper, timezone, isCompleted, score = null) => {
    const statusKey = timezone 
      ? `${subject}-${year}-${session}-${paper}-${timezone}`
      : `${subject}-${year}-${session}-${paper}`;
    
    const newStatus = !isCompleted;
    
    if (currentUser) {
      // Update server if logged in
      setCompletionStatus(prev => ({
        ...prev,
        [statusKey]: { is_completed: newStatus, score: newStatus ? score : null }
      }));
      
      const requestData = {
        subject_id: subject,
        year: year,
        session: session,
        paper: paper,
        timezone: timezone || null,
        is_completed: newStatus,
        score: newStatus ? score : null
      };
      
      axios.post(`${API_URL}/completion`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .catch(err => {
          console.error('Error updating completion status:', err);
          setCompletionStatus(prev => ({
            ...prev,
            [statusKey]: { is_completed: isCompleted, score: null }
          }));
          setError('Failed to update paper status');
          setTimeout(() => setError(''), 3000);
        });
    } else {
      // Update local storage for anonymous users
      const newCompletionStatus = {
        ...localCompletionStatus,
        [statusKey]: { is_completed: newStatus, score: newStatus ? score : null }
      };
      
      setLocalCompletionStatus(newCompletionStatus);
      setCompletionStatus(newCompletionStatus);
    }
  };

  const getPaperStatus = (subject, year, session, paper, timezone) => {
    const key = timezone 
      ? `${subject}-${year}-${session}-${paper}-${timezone}`
      : `${subject}-${year}-${session}-${paper}`;
    
    const status = completionStatus[key];
    return status?.is_completed || false;
  };

  const getPaperScore = (subject, year, session, paper, timezone) => {
    const key = timezone 
      ? `${subject}-${year}-${session}-${paper}-${timezone}`
      : `${subject}-${year}-${session}-${paper}`;
    
    const status = completionStatus[key];
    return status?.score || null;
  };

  const updatePaperScore = (subject, year, session, paper, timezone, score) => {
    const isCompleted = getPaperStatus(subject, year, session, paper, timezone);
    updatePaperStatus(subject, year, session, paper, timezone, !isCompleted, score);
  };

  // Calculate combined status for papers with TZ variants
  const getCombinedStatus = (subject, year, session, paper) => {
    const hasTZ = tzConfig[subject]?.[paper.toLowerCase().replace(' ', '')];
    if (!hasTZ) {
      return getPaperStatus(subject, year, session, paper) ? 'completed' : 'incomplete';
    }
    
    const tz1Completed = getPaperStatus(subject, year, session, paper, 'TZ1');
    const tz2Completed = getPaperStatus(subject, year, session, paper, 'TZ2');
    
    if (tz1Completed && tz2Completed) {
      return 'completed';
    } else if (tz1Completed || tz2Completed) {
      return 'partial';
    } else {
      return 'incomplete';
    }
  };
  
  // Calculate completion statistics
  const calculateStats = () => {
    if (!selectedSubject) return { completed: 0, total: 0, percentage: 0 };
    
    let completed = 0;
    let total = 0;
    
    years.forEach(year => {
      sessions.forEach(session => {
        const papersList = tzConfig[selectedSubject] 
          ? Object.keys(tzConfig[selectedSubject])
            .filter(key => key.startsWith('paper'))
            .map(key => `Paper ${key.charAt(5)}`)
          : [];
        
        if (papersList.length === 0) return;
        
        papersList.forEach(paper => {
          const hasTZ = tzConfig[selectedSubject]?.[paper.toLowerCase().replace(' ', '')];
          if (hasTZ) {
            timezones.forEach(timezone => {
              total++;
              if (getPaperStatus(selectedSubject, year, session, paper, timezone)) {
                completed++;
              }
            });
          } else {
            total++;
            if (getPaperStatus(selectedSubject, year, session, paper)) {
              completed++;
            }
          }
        });
      });
    });
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };
  
  const stats = calculateStats();

  if (loading || tzLoading) {
    return <div className="text-center py-4">Loading your papers...</div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Paper Tracking</h2>
        <p className="text-gray-500">Please add subjects first to start tracking papers.</p>
      </div>
    );
  }

  // Get available papers for the selected subject
  const availablePapers = selectedSubject && tzConfig[selectedSubject] 
    ? Object.keys(tzConfig[selectedSubject])
      .filter(key => key.startsWith('paper'))
      .map(key => `Paper ${key.charAt(5)}`)
    : [];

  const handleCheckboxChange = (subject, year, session, paper, timezone, isCompleted) => {
    if (!isCompleted) {
      // When marking as complete, show score dialog
      setScoreDialog({
        isOpen: true,
        paperInfo: { subject, year, session, paper, timezone, tempScore: '' }
      });
    } else {
      // When marking as incomplete, just update status
      updatePaperStatus(subject, year, session, paper, timezone, isCompleted);
    }
  };

  const handleScoreSubmit = () => {
    const { subject, year, session, paper, timezone, tempScore } = scoreDialog.paperInfo;
    const score = Math.min(100, Math.max(0, parseInt(tempScore) || 0));
    updatePaperStatus(subject, year, session, paper, timezone, false, score);
    setScoreDialog({ isOpen: false, paperInfo: null, tempScore: '' });
  };

  const handleScoreChange = (e) => {
    const value = e.target.value;
    setScoreDialog(prev => ({
      ...prev,
      paperInfo: { ...prev.paperInfo, tempScore: value }
    }));
  };

  const handleScoreCancel = () => {
    setScoreDialog({ isOpen: false, paperInfo: null, tempScore: '' });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Paper Tracking</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Subject to View
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
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Completion Status</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full" 
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{stats.percentage}%</span>
            </div>
            <p className="text-sm mt-2">
              {stats.completed} of {stats.total} papers completed
            </p>
          </div>
          
          {subjectHasAnyTZVariants && (
            <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Some papers for this subject have TZ1 and TZ2 variants. Click on the <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mx-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg> icon to see and track these variants.
              </p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  {availablePapers.map(paper => (
                    <th key={paper} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {paper}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {years.map(year => 
                  sessions.map((session, sessionIndex) => {
                    const rowKey = `${year}-${session}`;
                    const isExpanded = expandedRows[rowKey] || false;
                    const rowHasTZVariants = availablePapers
                      .some(paper => tzConfig[selectedSubject]?.[paper.toLowerCase().replace(' ', '')]);
                    
                    return (
                      <React.Fragment key={rowKey}>
                        <tr className={sessionIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="pl-4 py-4">
                            {rowHasTZVariants && (
                              <button 
                                onClick={() => toggleRowExpansion(rowKey)}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={isExpanded ? "Collapse row" : "Expand row"}
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                >
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session}</td>
                          
                          {availablePapers.map(paper => {
                            const paperHasTZ = tzConfig[selectedSubject]?.[paper.toLowerCase().replace(' ', '')];
                            const status = getCombinedStatus(selectedSubject, year, session, paper);
                            
                            if (paperHasTZ) {
                              return (
                                <td key={`${rowKey}-${paper}`} className="px-6 py-4 whitespace-nowrap">
                                  {status === 'completed' ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      All Complete
                                    </span>
                                  ) : status === 'partial' ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                      Partially Complete
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      Incomplete
                                    </span>
                                  )}
                                </td>
                              );
                            } else {
                              return (
                                <td key={`${rowKey}-${paper}`} className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-4">
                                    <label className="inline-flex items-center">
                                      <input
                                        type="checkbox"
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                        checked={getPaperStatus(selectedSubject, year, session, paper)}
                                        onChange={() => handleCheckboxChange(
                                          selectedSubject,
                                          year,
                                          session,
                                          paper,
                                          null,
                                          getPaperStatus(selectedSubject, year, session, paper)
                                        )}
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Completed</span>
                                    </label>
                                    {getPaperStatus(selectedSubject, year, session, paper) && getPaperScore(selectedSubject, year, session, paper) !== null && (
                                      <span className="text-sm text-gray-600">
                                        Score: {getPaperScore(selectedSubject, year, session, paper)}%
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            }
                          })}
                        </tr>
                        
                        {isExpanded && rowHasTZVariants && (
                          <tr className={sessionIndex % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50'}>
                            <td></td>
                            <td colSpan="2" className="px-6 py-3 text-sm text-gray-500 text-right">
                              <span className="font-medium">Timezone Variants:</span>
                            </td>
                            
                            {availablePapers.map(paper => {
                              const hasTZ = tzConfig[selectedSubject]?.[paper.toLowerCase().replace(' ', '')];
                              
                              if (hasTZ) {
                                return (
                                  <td key={`${rowKey}-${paper}-tz`} className="px-6 py-3">
                                    <div className="flex flex-col space-y-2">
                                      {timezones.map(timezone => (
                                        <div key={timezone} className="flex items-center space-x-4">
                                          <label className="inline-flex items-center">
                                            <input
                                              type="checkbox"
                                              className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                              checked={getPaperStatus(selectedSubject, year, session, paper, timezone)}
                                              onChange={() => handleCheckboxChange(
                                                selectedSubject,
                                                year,
                                                session,
                                                paper,
                                                timezone,
                                                getPaperStatus(selectedSubject, year, session, paper, timezone)
                                              )}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{timezone}</span>
                                          </label>
                                          {getPaperStatus(selectedSubject, year, session, paper, timezone) && 
                                           getPaperScore(selectedSubject, year, session, paper, timezone) !== null && (
                                            <span className="text-sm text-gray-600">
                                              Score: {getPaperScore(selectedSubject, year, session, paper, timezone)}%
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                );
                              } else {
                                return <td key={`${rowKey}-${paper}-tz`} className="px-6 py-3 text-sm text-gray-400 italic">N/A</td>;
                              }
                            })}
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {/* Score Dialog */}
      {scoreDialog.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Enter Score</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  {scoreDialog.paperInfo.paper} - {scoreDialog.paperInfo.session} {scoreDialog.paperInfo.year}
                  {scoreDialog.paperInfo.timezone ? ` (${scoreDialog.paperInfo.timezone})` : ''}
                </p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreDialog.paperInfo.tempScore}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  placeholder="Score (0-100)"
                  onChange={handleScoreChange}
                />
              </div>
              <div className="items-center px-4 py-3 space-x-4">
                <button
                  onClick={handleScoreSubmit}
                  disabled={!scoreDialog.paperInfo.tempScore}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
                <button
                  onClick={handleScoreCancel}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperTracking;