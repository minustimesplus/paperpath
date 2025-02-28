import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  return React.useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/token`, formData);
    const accessToken = response.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    return response;
  };

  const register = async (username, email, password) => {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password
    });
    const accessToken = response.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Login Component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">IB Paper Tracker Login</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-800">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create an Account</h2>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Register
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-800">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Subject Selection Component
const SubjectSelection = ({ onSubjectsChange }) => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([
    { id: 'math_aa_sl', name: 'Mathematics AA SL' },
    { id: 'math_aa_hl', name: 'Mathematics AA HL' },
    { id: 'math_ai_sl', name: 'Mathematics AI SL' },
    { id: 'math_ai_hl', name: 'Mathematics AI HL' },
    { id: 'physics_sl', name: 'Physics SL' },
    { id: 'physics_hl', name: 'Physics HL' },
    { id: 'chemistry_sl', name: 'Chemistry SL' },
    { id: 'chemistry_hl', name: 'Chemistry HL' },
    { id: 'biology_sl', name: 'Biology SL' },
    { id: 'biology_hl', name: 'Biology HL' },
    { id: 'english_a_sl', name: 'English A Lang & Lit SL' },
    { id: 'english_a_hl', name: 'English A Lang & Lit HL' },
    { id: 'english_b_sl', name: 'English B SL' },
    { id: 'english_b_hl', name: 'English B HL' },
    { id: 'french_b_sl', name: 'French B SL' },
    { id: 'french_b_hl', name: 'French B HL' },
    { id: 'spanish_b_sl', name: 'Spanish B SL' },
    { id: 'spanish_b_hl', name: 'Spanish B HL' },
    { id: 'economics_sl', name: 'Economics SL' },
    { id: 'economics_hl', name: 'Economics HL' },
    { id: 'history_sl', name: 'History SL' },
    { id: 'history_hl', name: 'History HL' },
    { id: 'psychology_sl', name: 'Psychology SL' },
    { id: 'psychology_hl', name: 'Psychology HL' },
    { id: 'computer_science_sl', name: 'Computer Science SL' },
    { id: 'computer_science_hl', name: 'Computer Science HL' },
  ]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch user's subjects
    axios.get(`${API_URL}/subjects`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setSubjects(response.data.subjects || []);
      })
      .catch(err => {
        console.error('Error fetching subjects:', err);
      });
  }, [token]);

  const handleAddSubject = () => {
    if (!selectedSubject) return;
    
    // Check if subject already added
    if (subjects.includes(selectedSubject)) {
      setError('This subject has already been added');
      return;
    }
    
    const newSubjects = [...subjects, selectedSubject];
    
    // Save to API
    axios.post(`${API_URL}/subjects`, { subjects: newSubjects }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setSubjects(newSubjects);
        setSelectedSubject('');
        setMessage('Subject added successfully');
        setError('');
        setTimeout(() => setMessage(''), 3000);
        // Notify parent component about the change
        if (onSubjectsChange) onSubjectsChange();
      })
      .catch(err => {
        console.error('Error saving subjects:', err);
        setError('Failed to save subject');
      });
  };

  const handleRemoveSubject = (subjectId) => {
    const newSubjects = subjects.filter(s => s !== subjectId);
    
    // Save to API
    axios.post(`${API_URL}/subjects`, { subjects: newSubjects }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setSubjects(newSubjects);
        setMessage('Subject removed successfully');
        setError('');
        setTimeout(() => setMessage(''), 3000);
        // Notify parent component about the change
        if (onSubjectsChange) onSubjectsChange();
      })
      .catch(err => {
        console.error('Error removing subject:', err);
        setError('Failed to remove subject');
      });
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">My Subjects</h2>
      
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Add a Subject
        </label>
        <div className="flex">
          <select
            className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select a subject...</option>
            {availableSubjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddSubject}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            disabled={!selectedSubject}
          >
            Add
          </button>
        </div>
      </div>
      
      {subjects.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-2">Your Selected Subjects:</h3>
          <ul className="divide-y divide-gray-200">
            {subjects.map(subject => (
              <li key={subject} className="py-3 flex justify-between items-center">
                <span>{getSubjectName(subject)}</span>
                <button
                  onClick={() => handleRemoveSubject(subject)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 italic">No subjects added yet. Add your IB subjects to start tracking past papers.</p>
      )}
    </div>
  );
};

// Paper Tracking Component
const PaperTracking = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([
    { id: 'math_aa_sl', name: 'Mathematics AA SL' },
    { id: 'math_aa_hl', name: 'Mathematics AA HL' },
    { id: 'math_ai_sl', name: 'Mathematics AI SL' },
    { id: 'math_ai_hl', name: 'Mathematics AI HL' },
    { id: 'physics_sl', name: 'Physics SL' },
    { id: 'physics_hl', name: 'Physics HL' },
    { id: 'chemistry_sl', name: 'Chemistry SL' },
    { id: 'chemistry_hl', name: 'Chemistry HL' },
    { id: 'biology_sl', name: 'Biology SL' },
    { id: 'biology_hl', name: 'Biology HL' },
    { id: 'english_a_sl', name: 'English A Lang & Lit SL' },
    { id: 'english_a_hl', name: 'English A Lang & Lit HL' },
    { id: 'english_b_sl', name: 'English B SL' },
    { id: 'english_b_hl', name: 'English B HL' },
    { id: 'french_b_sl', name: 'French B SL' },
    { id: 'french_b_hl', name: 'French B HL' },
    { id: 'spanish_b_sl', name: 'Spanish B SL' },
    { id: 'spanish_b_hl', name: 'Spanish B HL' },
    { id: 'economics_sl', name: 'Economics SL' },
    { id: 'economics_hl', name: 'Economics HL' },
    { id: 'history_sl', name: 'History SL' },
    { id: 'history_hl', name: 'History HL' },
    { id: 'psychology_sl', name: 'Psychology SL' },
    { id: 'psychology_hl', name: 'Psychology HL' },
    { id: 'computer_science_sl', name: 'Computer Science SL' },
    { id: 'computer_science_hl', name: 'Computer Science HL' },
  ]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const sessions = ['May', 'November'];
  const papers = ['Paper 1', 'Paper 2', 'Paper 3'];

  useEffect(() => {
    // Fetch user's subjects
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
  }, [token]);

  const updatePaperStatus = (subject, year, session, paper, isCompleted) => {
    const statusKey = `${subject}-${year}-${session}-${paper}`;
    const newStatus = !isCompleted;
    
    // Optimistic update
    setCompletionStatus({
      ...completionStatus,
      [statusKey]: newStatus
    });
    
    // Save to API
    axios.post(`${API_URL}/completion`, {
      subject_id: subject,
      year: year,
      session: session,
      paper: paper,
      is_completed: newStatus
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .catch(err => {
        console.error('Error updating completion status:', err);
        // Revert on error
        setCompletionStatus({
          ...completionStatus,
          [statusKey]: isCompleted
        });
        setError('Failed to update paper status');
      });
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  const getPaperStatus = (subject, year, session, paper) => {
    const key = `${subject}-${year}-${session}-${paper}`;
    return completionStatus[key] || false;
  };
  
  // Calculate completion statistics
  const calculateStats = () => {
    if (!selectedSubject) return { completed: 0, total: 0, percentage: 0 };
    
    let completed = 0;
    let total = 0;
    
    years.forEach(year => {
      sessions.forEach(session => {
        const papersToCheck = selectedSubject.includes('_hl') && paper === 'Paper 3' ? papers : papers.slice(0, 2);
        papersToCheck.forEach(paper => {
          total++;
          if (getPaperStatus(selectedSubject, year, session, paper)) {
            completed++;
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

  if (loading) {
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
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper 1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper 2</th>
                  {selectedSubject.includes('_hl') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper 3</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {years.map(year => 
                  sessions.map((session, sessionIndex) => (
                    <tr key={`${year}-${session}`} className={sessionIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session}</td>
                      {papers.slice(0, selectedSubject.includes('_hl') ? 3 : 2).map(paper => (
                        <td key={`${year}-${session}-${paper}`} className="px-6 py-4 whitespace-nowrap">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-blue-600"
                              checked={getPaperStatus(selectedSubject, year, session, paper)}
                              onChange={() => updatePaperStatus(
                                selectedSubject,
                                year,
                                session,
                                paper,
                                getPaperStatus(selectedSubject, year, session, paper)
                              )}
                            />
                            <span className="ml-2 text-sm text-gray-700">Completed</span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [subjectsUpdated, setSubjectsUpdated] = useState(false);

  // Function to trigger update in the PaperTracking component
  const handleSubjectsChange = () => {
    setSubjectsUpdated(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">IB Paper Tracker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Hello, {currentUser?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          <SubjectSelection onSubjectsChange={handleSubjectsChange} />
          <PaperTracking key={subjectsUpdated} />
        </div>
      </main>
    </div>
  );
};

// App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;