import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://papertrackerforib.onrender.com';

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
  const [subjectGroups, setSubjectGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch user's subjects and subject groups
    Promise.all([
      axios.get(`${API_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`${API_URL}/subject-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
      .then(([subjectsResponse, groupsResponse]) => {
        setSubjects(subjectsResponse.data.subjects || []);
        
        if (groupsResponse.data.subject_groups) {
          setSubjectGroups(groupsResponse.data.subject_groups);
        } else {
          // Fallback to hardcoded subject groups if API doesn't return them
          setSubjectGroups({
            "Group 1 - Studies in Language and Literature": [
              "English A Literature", "English A Language and Literature", "German A"
            ],
            "Group 2 - Language Acquisition": [
              "English B", "French B", "Spanish B", "German B", "Mandarin B"
            ],
            "Group 3 - Individuals and Societies": [
              "History", "Geography", "Economics", "Psychology", "Business Management", "Environmental Systems and Societies (ESS)"
            ],
            "Group 4 - Sciences": [
              "Biology", "Chemistry", "Physics", "Computer Science", "Environmental Systems and Societies (ESS)"
            ],
            "Group 5 - Mathematics": [
              "Mathematics: Analysis and Approaches", "Mathematics: Applications and Interpretation"
            ],
            "Group 6 - The Arts": [
              "Visual Arts", "Music", "Theatre", "Film", "Dance", "Design"
            ]
          });
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Error loading subject groups');
        
        // Fallback to hardcoded if API fails
        setSubjectGroups({
          "Group 1 - Studies in Language and Literature": [
            "English A Literature", "English A Language and Literature", "German A"
          ],
          "Group 2 - Language Acquisition": [
            "English B", "French B", "Spanish B", "German B", "Mandarin B"
          ],
          "Group 3 - Individuals and Societies": [
            "History", "Geography", "Economics", "Psychology", "Business Management", "Environmental Systems and Societies (ESS)"
          ],
          "Group 4 - Sciences": [
            "Biology", "Chemistry", "Physics", "Computer Science", "Environmental Systems and Societies (ESS)"
          ],
          "Group 5 - Mathematics": [
            "Mathematics: Analysis and Approaches", "Mathematics: Applications and Interpretation"
          ],
          "Group 6 - The Arts": [
            "Visual Arts", "Music", "Theatre", "Film", "Dance", "Design"
          ]
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // List of all available subjects with their IDs
  const availableSubjects = [
    // Group 1 - Studies in Language and Literature
    { id: 'english_a_literature_sl', name: 'English A Literature SL', group: 1 },
    { id: 'english_a_literature_hl', name: 'English A Literature HL', group: 1 },
    { id: 'english_a_lang_lit_sl', name: 'English A Lang & Lit SL', group: 1 },
    { id: 'english_a_lang_lit_hl', name: 'English A Lang & Lit HL', group: 1 },
    { id: 'german_a_sl', name: 'German A Lang & Lit SL', group: 1 },
    { id: 'german_a_hl', name: 'German A Lang & Lit HL', group: 1 },
    
    // Group 2 - Language Acquisition
    { id: 'english_b_sl', name: 'English B SL', group: 2 },
    { id: 'english_b_hl', name: 'English B HL', group: 2 },
    { id: 'french_b_sl', name: 'French B SL', group: 2 },
    { id: 'french_b_hl', name: 'French B HL', group: 2 },
    { id: 'spanish_b_sl', name: 'Spanish B SL', group: 2 },
    { id: 'spanish_b_hl', name: 'Spanish B HL', group: 2 },
    { id: 'german_b_sl', name: 'German B SL', group: 2 },
    { id: 'german_b_hl', name: 'German B HL', group: 2 },
    
    // Group 3 - Individuals and Societies
    { id: 'economics_sl', name: 'Economics SL', group: 3 },
    { id: 'economics_hl', name: 'Economics HL', group: 3 },
    { id: 'history_sl', name: 'History SL', group: 3 },
    { id: 'history_hl', name: 'History HL', group: 3 },
    { id: 'psychology_sl', name: 'Psychology SL', group: 3 },
    { id: 'psychology_hl', name: 'Psychology HL', group: 3 },
    { id: 'geography_sl', name: 'Geography SL', group: 3 },
    { id: 'geography_hl', name: 'Geography HL', group: 3 },
    { id: 'ess_sl', name: 'Environmental Systems & Societies SL', group: 3 },
    
    // Group 4 - Sciences
    { id: 'physics_sl', name: 'Physics SL', group: 4 },
    { id: 'physics_hl', name: 'Physics HL', group: 4 },
    { id: 'chemistry_sl', name: 'Chemistry SL', group: 4 },
    { id: 'chemistry_hl', name: 'Chemistry HL', group: 4 },
    { id: 'biology_sl', name: 'Biology SL', group: 4 },
    { id: 'biology_hl', name: 'Biology HL', group: 4 },
    { id: 'computer_science_sl', name: 'Computer Science SL', group: 4 },
    { id: 'computer_science_hl', name: 'Computer Science HL', group: 4 },
    
    // Group 5 - Mathematics
    { id: 'math_aa_sl', name: 'Mathematics AA SL', group: 5 },
    { id: 'math_aa_hl', name: 'Mathematics AA HL', group: 5 },
    { id: 'math_ai_sl', name: 'Mathematics AI SL', group: 5 },
    { id: 'math_ai_hl', name: 'Mathematics AI HL', group: 5 },
    
    // Group 6 - The Arts
    { id: 'visual_arts_sl', name: 'Visual Arts SL', group: 6 },
    { id: 'visual_arts_hl', name: 'Visual Arts HL', group: 6 },
    { id: 'design_tech_sl', name: 'Design Technology SL', group: 6 },
    { id: 'design_tech_hl', name: 'Design Technology HL', group: 6 }
  ];

  const toggleSubject = (subjectId) => {
    let newSubjects;
    
    if (subjects.includes(subjectId)) {
      // Remove subject if already selected
      newSubjects = subjects.filter(s => s !== subjectId);
    } else {
      // Add subject if not already selected
      newSubjects = [...subjects, subjectId];
    }
    
    // Save to API
    axios.post(`${API_URL}/subjects`, { subjects: newSubjects }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setSubjects(newSubjects);
        setMessage(subjects.includes(subjectId) ? 'Subject removed successfully' : 'Subject added successfully');
        setError('');
        setTimeout(() => setMessage(''), 3000);
        // Notify parent component about the change
        if (onSubjectsChange) onSubjectsChange();
      })
      .catch(err => {
        console.error('Error updating subjects:', err);
        setError('Failed to update subjects');
      });
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">
      <p className="text-gray-500">Loading subjects...</p>
    </div>;
  }

  // Group subjects according to IB groups
  const getSubjectsByGroupNumber = (groupNumber) => {
    return availableSubjects.filter(s => s.group === groupNumber);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My IB Subjects</h2>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
        >
          {isDropdownOpen ? 'Hide' : 'Edit'} Subjects
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {/* Selected subjects display */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Selected Subjects:</h3>
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <span key={subject} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
                {getSubjectName(subject)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No subjects selected yet. Edit subjects to get started.</p>
        )}
      </div>
      
      {/* Subject selection dropdown */}
      {isDropdownOpen && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Select Your IB Subjects:</h3>
          
          {/* Group 1 - Studies in Language and Literature */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Group 1 - Studies in Language and Literature</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getSubjectsByGroupNumber(1).map(subject => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={subjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Group 2 - Language Acquisition */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Group 2 - Language Acquisition</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getSubjectsByGroupNumber(2).map(subject => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={subjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Group 3 - Individuals and Societies */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Group 3 - Individuals and Societies</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getSubjectsByGroupNumber(3).map(subject => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={subjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Group 4 - Sciences */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Group 4 - Sciences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getSubjectsByGroupNumber(4).map(subject => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={subjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Group 5 - Mathematics */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Group 5 - Mathematics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getSubjectsByGroupNumber(5).map(subject => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={subjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Group 6 - The Arts */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Group 6 - The Arts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getSubjectsByGroupNumber(6).map(subject => (
                <div key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={subject.id}
                    checked={subjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Paper Tracking Component
const PaperTracking = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const sessions = ['May', 'November'];
  const papers = ['Paper 1', 'Paper 2', 'Paper 3'];

  useEffect(() => {
    // Fetch user's subjects and completion status
    Promise.all([
      axios.get(`${API_URL}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/completion`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([subjectsResponse, completionResponse]) => {
        const userSubjects = subjectsResponse.data.subjects || [];
        setSubjects(userSubjects);
        setCompletionStatus(completionResponse.data || {});
        
        // Set the first subject as selected by default
        if (userSubjects.length > 0) {
          setSelectedSubject(userSubjects[0]);
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
        // Use a simplified papersToCheck assignment
        const papersCount = selectedSubject.includes('_hl') ? 3 : 2;
        for (let i = 0; i < papersCount; i++) {
          total++;
          if (getPaperStatus(selectedSubject, year, session, papers[i])) {
            completed++;
          }
        }
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