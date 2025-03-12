import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTimezoneConfig } from '../contexts/TimezoneContext';
import { getSubjectName } from '../config/subjectConfig';
import YearRangeSelector from './YearRangeSelector';
import TimezoneToggle from './TimezoneToggle';
import axios from 'axios';

const API_URL = 'https://papertrackerforib.onrender.com';

// Default years array is now defined but will be filtered by the selected range
const ALL_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
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
  const { tzConfig, loading: tzLoading, getYearRange, getEffectiveTimezoneSetting } = useTimezoneConfig();
  const [subjects, setSubjects] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [scoreDialog, setScoreDialog] = useState({ isOpen: false, paperInfo: null, tempScore: '' });
  const [showTZBanner, setShowTZBanner] = useState(() => {
    const saved = localStorage.getItem('tzBannerDismissed') === 'true';
    return !saved;
  });
  
  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ message: '', email: '', sending: false, sent: false });

  // Get filtered years based on selected subject's year range
  const years = useMemo(() => {
    if (!selectedSubject) return ALL_YEARS;
    
    const { startYear, endYear } = getYearRange(selectedSubject);
    return ALL_YEARS.filter(year => year >= startYear && year <= endYear);
  }, [selectedSubject, getYearRange]);

  // Toggle row expansion
  const toggleRowExpansion = (rowKey) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };
  
  // Check if selected subject has any papers with TZ variants based on effective settings
  const subjectHasAnyTZVariants = selectedSubject ? 
    Object.keys(tzConfig[selectedSubject] || {})
      .filter(key => key.startsWith('paper'))
      .some(paperKey => {
        // Add null check to avoid errors if getEffectiveTimezoneSetting is undefined
        return typeof getEffectiveTimezoneSetting === 'function' 
          ? getEffectiveTimezoneSetting(selectedSubject, paperKey)
          : (tzConfig[selectedSubject]?.[paperKey] || false);
      }) : 
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
          if (!selectedSubject && subjectsResponse.data.subjects && subjectsResponse.data.subjects.length > 0) {
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
      if (!selectedSubject && localSubjects.length > 0) {
        setSelectedSubject(localSubjects[0]);
      }
      setLoading(false);
    }
  }, [token, currentUser, localSubjects, localCompletionStatus, selectedSubject]);

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
    const paperKey = paper.toLowerCase().replace(' ', '');
    
    // Add null check for getEffectiveTimezoneSetting
    const hasTZ = typeof getEffectiveTimezoneSetting === 'function'
      ? getEffectiveTimezoneSetting(subject, paperKey)
      : (tzConfig[subject]?.[paperKey] || false);
      
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
          const paperKey = paper.toLowerCase().replace(' ', '');
          
          // Add null check for getEffectiveTimezoneSetting
          const hasTZ = typeof getEffectiveTimezoneSetting === 'function'
            ? getEffectiveTimezoneSetting(selectedSubject, paperKey)
            : (tzConfig[selectedSubject]?.[paperKey] || false);
          
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

  // Handle banner dismissal
  const handleTZBannerDismiss = () => {
    setShowTZBanner(false);
    localStorage.setItem('tzBannerDismissed', 'true');
  };

  // Handle feedback form
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackForm(prev => ({ ...prev, sending: true }));
    
    try {
      await axios.post(`${API_URL}/feedback`, {
        message: feedbackForm.message,
        email: feedbackForm.email || 'Anonymous',
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.email : 'Anonymous'
      });
      
      setFeedbackForm({ message: '', email: '', sending: false, sent: true });
      
      // Reset the "sent" message after 5 seconds
      setTimeout(() => {
        setFeedbackForm(prev => ({ ...prev, sent: false }));
        setFeedbackOpen(false);
      }, 5000);
    } catch (err) {
      console.error('Error sending feedback:', err);
      setError('Failed to submit feedback. Please try again.');
      setFeedbackForm(prev => ({ ...prev, sending: false }));
      
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading || tzLoading) {
    return <div className="text-center py-4 text-gray-700 dark:text-gray-300">Loading your papers...</div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Paper Tracking</h2>
        <p className="text-gray-500 dark:text-gray-400">Please add subjects first to start tracking papers.</p>
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
    // Fix: Update the paper status as completed with null score when skipping
    const { subject, year, session, paper, timezone } = scoreDialog.paperInfo;
    updatePaperStatus(subject, year, session, paper, timezone, false, null);
    setScoreDialog({ isOpen: false, paperInfo: null, tempScore: '' });
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Paper Tracking</h2>
      
      {error && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          Select Subject to View
        </label>
        <select
          className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline"
          value={selectedSubject}
          onChange={handleSubjectChange}
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
          {/* Year Range and Timezone Settings in same row */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-grow">
              <YearRangeSelector subjectId={selectedSubject} />
            </div>
            <div>
              <TimezoneToggle subjectId={selectedSubject} />
            </div>
          </div>

          <div className="mb-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Completion Status</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mr-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full" 
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.percentage}%</span>
            </div>
            <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
              {stats.completed} of {stats.total} papers completed
            </p>
          </div>
          
          {subjectHasAnyTZVariants && showTZBanner && (
            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="p-3 flex justify-between items-start">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-sm text-yellow-800 dark:text-yellow-300">
                    Some papers for this subject have TZ1 and TZ2 variants. Click on the <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mx-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg> icon to see and track these variants.
                  </p>
                </div>
                <button
                  onClick={handleTZBannerDismiss}
                  className="flex-shrink-0 ml-4 bg-transparent rounded-md p-0.5 inline-flex text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Session</th>
                  {availablePapers.map(paper => (
                    <th key={paper} className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {paper}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {years.map(year => 
                  sessions.map((session, sessionIndex) => {
                    const rowKey = `${year}-${session}`;
                    const isExpanded = expandedRows[rowKey] || false;
                    const rowHasTZVariants = availablePapers
                      .some(paper => {
                        const paperKey = paper.toLowerCase().replace(' ', '');
                        return typeof getEffectiveTimezoneSetting === 'function'
                          ? getEffectiveTimezoneSetting(selectedSubject, paperKey)
                          : (tzConfig[selectedSubject]?.[paperKey] || false);
                      });
                    
                    return (
                      <React.Fragment key={rowKey}>
                        <tr className={sessionIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}>
                          <td className="pl-4 py-4">
                            {rowHasTZVariants && (
                              <button 
                                onClick={() => toggleRowExpansion(rowKey)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{session}</td>
                          
                          {availablePapers.map(paper => {
                            const paperKey = paper.toLowerCase().replace(' ', '');
                            const paperHasTZ = typeof getEffectiveTimezoneSetting === 'function'
                              ? getEffectiveTimezoneSetting(selectedSubject, paperKey)
                              : (tzConfig[selectedSubject]?.[paperKey] || false);
                            const status = getCombinedStatus(selectedSubject, year, session, paper);
                            
                            if (paperHasTZ) {
                              return (
                                <td key={`${rowKey}-${paper}`} className="px-6 py-4 whitespace-nowrap">
                                  {status === 'completed' ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                                      All Complete
                                    </span>
                                  ) : status === 'partial' ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200">
                                      Partially Complete
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
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
                                        className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400 rounded dark:bg-gray-700 dark:border-gray-600"
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
                                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Completed</span>
                                    </label>
                                    {getPaperStatus(selectedSubject, year, session, paper) && getPaperScore(selectedSubject, year, session, paper) !== null && (
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
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
                          <tr className={sessionIndex % 2 === 0 ? 'bg-gray-100 dark:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700'}>
                            <td></td>
                            <td colSpan="2" className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                              <span className="font-medium">Timezone Variants:</span>
                            </td>
                            
                            {availablePapers.map(paper => {
                              const paperKey = paper.toLowerCase().replace(' ', '');
                              const hasTZ = typeof getEffectiveTimezoneSetting === 'function'
                                ? getEffectiveTimezoneSetting(selectedSubject, paperKey)
                                : (tzConfig[selectedSubject]?.[paperKey] || false);
                              
                              if (hasTZ) {
                                return (
                                  <td key={`${rowKey}-${paper}-tz`} className="px-6 py-3">
                                    <div className="flex flex-col space-y-2">
                                      {timezones.map(timezone => (
                                        <div key={timezone} className="flex items-center space-x-4">
                                          <label className="inline-flex items-center">
                                            <input
                                              type="checkbox"
                                              className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400 rounded dark:bg-gray-700 dark:border-gray-600"
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
                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{timezone}</span>
                                          </label>
                                          {getPaperStatus(selectedSubject, year, session, paper, timezone) && 
                                           getPaperScore(selectedSubject, year, session, paper, timezone) !== null && (
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                              Score: {getPaperScore(selectedSubject, year, session, paper, timezone)}%
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                );
                              } else {
                                return <td key={`${rowKey}-${paper}-tz`} className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500 italic">N/A</td>;
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Enter Score</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {scoreDialog.paperInfo.paper} - {scoreDialog.paperInfo.session} {scoreDialog.paperInfo.year}
                  {scoreDialog.paperInfo.timezone ? ` (${scoreDialog.paperInfo.timezone})` : ''}
                </p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreDialog.paperInfo.tempScore}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
      
      {/* Feedback Button & Form */}
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Give Feedback
          </button>
        </div>
        
        {feedbackOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Your Feedback</h3>
                  <button
                    onClick={() => setFeedbackOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {feedbackForm.sent ? (
                  <div className="text-center py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">Thank you for your feedback!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your feedback has been submitted successfully.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="mt-2 px-7 py-3">
                      <textarea
                        name="message"
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Tell us what you think or suggest improvements..."
                        value={feedbackForm.message}
                        onChange={handleFeedbackChange}
                        required
                      />
                      
                      <input
                        type="email"
                        name="email"
                        className="mt-4 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        placeholder="Your email (optional)"
                        value={feedbackForm.email}
                        onChange={handleFeedbackChange}
                      />
                    </div>
                    
                    <div className="flex justify-center px-4 py-3">
                      <button
                        type="submit"
                        disabled={feedbackForm.sending || !feedbackForm.message}
                        className="w-full px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {feedbackForm.sending ? 'Sending...' : 'Submit Feedback'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperTracking;