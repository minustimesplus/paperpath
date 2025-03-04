import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://papertrackerforib.onrender.com';

// Define timezone configuration directly in the file
const TIMEZONE_CONFIG = {
  // Group 1
  "english_a_sl": {"paper1": true, "paper2": true},
  "english_a_hl": {"paper1": true, "paper2": true},
  "german_a_sl": {"paper1": false, "paper2": false},
  "german_a_hl": {"paper1": false, "paper2": false},
  
  // Group 2
  "english_b_sl": {"paper1": true, "paper2": true},
  "english_b_hl": {"paper1": true, "paper2": true},
  "french_b_sl": {"paper1": true, "paper2": true},
  "french_b_hl": {"paper1": true, "paper2": true},
  "spanish_b_sl": {"paper1": true, "paper2": true},
  "spanish_b_hl": {"paper1": true, "paper2": true},
  "german_b_sl": {"paper1": false, "paper2": false},
  "german_b_hl": {"paper1": false, "paper2": false},
  
  // Group 3
  "economics_sl": {"paper1": true, "paper2": true},
  "economics_hl": {"paper1": true, "paper2": true, "paper3": true},
  "history_sl": {"paper1": true, "paper2": true},
  "history_hl": {"paper1": true, "paper2": true, "paper3": true},
  "psychology_sl": {"paper1": true, "paper2": true},
  "psychology_hl": {"paper1": true, "paper2": true, "paper3": true},
  "geography_sl": {"paper1": true, "paper2": true},
  "geography_hl": {"paper1": true, "paper2": true, "paper3": true},
  "ess_sl": {"paper1": true, "paper2": true},
  
  // Group 4
  "physics_sl": {"paper1": true, "paper2": true, "paper3": true},
  "physics_hl": {"paper1": true, "paper2": true, "paper3": true},
  "chemistry_sl": {"paper1": true, "paper2": true, "paper3": true},
  "chemistry_hl": {"paper1": true, "paper2": true, "paper3": true},
  "biology_sl": {"paper1": true, "paper2": true, "paper3": true},
  "biology_hl": {"paper1": true, "paper2": true, "paper3": true},
  "computer_science_sl": {"paper1": true, "paper2": true},
  "computer_science_hl": {"paper1": true, "paper2": true, "paper3": true},
  
  // Group 5
  "math_aa_sl": {"paper1": true, "paper2": true},
  "math_aa_hl": {"paper1": true, "paper2": true},
  "math_ai_sl": {"paper1": true, "paper2": true},
  "math_ai_hl": {"paper1": true, "paper2": true},
  
  // Group 6
  "visual_arts_sl": {"paper1": false},
  "visual_arts_hl": {"paper1": false},
  "design_tech_sl": {"paper1": true, "paper2": true},
  "design_tech_hl": {"paper1": true, "paper2": true, "paper3": true}
};

// Helper functions for timezone variants
const hasTZVariants = (subjectId, paper) => {
  const paperKey = paper.toLowerCase().replace(' ', '');
  if (!TIMEZONE_CONFIG[subjectId] || !TIMEZONE_CONFIG[subjectId][paperKey]) {
    return false;
  }
  return TIMEZONE_CONFIG[subjectId][paperKey];
};

const subjectHasTZVariants = (subjectId) => {
  if (!TIMEZONE_CONFIG[subjectId]) {
    return false;
  }
  
  return Object.values(TIMEZONE_CONFIG[subjectId]).some(hasTZ => hasTZ === true);
};

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
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">IB Past Paper Tracker - Login</h2>
        
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
    // Group 1: Studies in Language and Literature
    { id: 'english_a_sl', name: 'English A Lit SL', group: 1 },
    { id: 'english_a_hl', name: 'English A Lit HL', group: 1 },
    { id: 'german_a_sl', name: 'German A Lang & Lit SL', group: 1 },
    { id: 'german_a_hl', name: 'German A Lang & Lit HL', group: 1 },
    
    // Group 2: Language Acquisition
    { id: 'english_b_sl', name: 'English B SL', group: 2 },
    { id: 'english_b_hl', name: 'English B HL', group: 2 },
    { id: 'french_b_sl', name: 'French B SL', group: 2 },
    { id: 'french_b_hl', name: 'French B HL', group: 2 },
    { id: 'spanish_b_sl', name: 'Spanish B SL', group: 2 },
    { id: 'spanish_b_hl', name: 'Spanish B HL', group: 2 },
    { id: 'german_b_sl', name: 'German B SL', group: 2 },
    { id: 'german_b_hl', name: 'German B HL', group: 2 },
    
    // Group 3: Individuals and Societies
    { id: 'economics_sl', name: 'Economics SL', group: 3 },
    { id: 'economics_hl', name: 'Economics HL', group: 3 },
    { id: 'history_sl', name: 'History SL', group: 3 },
    { id: 'history_hl', name: 'History HL', group: 3 },
    { id: 'psychology_sl', name: 'Psychology SL', group: 3 },
    { id: 'psychology_hl', name: 'Psychology HL', group: 3 },
    { id: 'geography_sl', name: 'Geography SL', group: 3 },
    { id: 'geography_hl', name: 'Geography HL', group: 3 },
    { id: 'ess_sl', name: 'Environmental Systems & Societies SL', group: 3 },
    
    // Group 4: Sciences
    { id: 'physics_sl', name: 'Physics SL', group: 4 },
    { id: 'physics_hl', name: 'Physics HL', group: 4 },
    { id: 'chemistry_sl', name: 'Chemistry SL', group: 4 },
    { id: 'chemistry_hl', name: 'Chemistry HL', group: 4 },
    { id: 'biology_sl', name: 'Biology SL', group: 4 },
    { id: 'biology_hl', name: 'Biology HL', group: 4 },
    { id: 'computer_science_sl', name: 'Computer Science SL', group: 4 },
    { id: 'computer_science_hl', name: 'Computer Science HL', group: 4 },
    
    // Group 5: Mathematics
    { id: 'math_aa_sl', name: 'Mathematics AA SL', group: 5 },
    { id: 'math_aa_hl', name: 'Mathematics AA HL', group: 5 },
    { id: 'math_ai_sl', name: 'Mathematics AI SL', group: 5 },
    { id: 'math_ai_hl', name: 'Mathematics AI HL', group: 5 },
    
    // Group 6: The Arts
    { id: 'visual_arts_sl', name: 'Visual Arts SL', group: 6 },
    { id: 'visual_arts_hl', name: 'Visual Arts HL', group: 6 },
    { id: 'design_tech_sl', name: 'Design Technology SL', group: 6 },
    { id: 'design_tech_hl', name: 'Design Technology HL', group: 6 }
  ]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Group subjects by category
  const groupedSubjects = {
    'Group 1 - Studies in Language and Literature': availableSubjects.filter(s => 
      s.id.startsWith('english_a_') || 
      s.id.startsWith('german_a_')
    ),
    'Group 2 - Language Acquisition': availableSubjects.filter(s => 
      (s.id.startsWith('english_b_') || 
      s.id.startsWith('french_b_') || 
      s.id.startsWith('spanish_b_') ||
      s.id.startsWith('german_b_'))
    ),
    'Group 3 - Individuals and Societies': availableSubjects.filter(s => 
      s.id.startsWith('economics_') || 
      s.id.startsWith('history_') || 
      s.id.startsWith('psychology_') ||
      s.id.startsWith('geography_') ||
      s.id === 'ess_sl'
    ),
    'Group 4 - Sciences': availableSubjects.filter(s => 
      s.id.startsWith('physics_') || 
      s.id.startsWith('chemistry_') || 
      s.id.startsWith('biology_') || 
      s.id.startsWith('computer_science_')
    ),
    'Group 5 - Mathematics': availableSubjects.filter(s => 
      s.id.startsWith('math_')
    ),
    'Group 6 - The Arts': availableSubjects.filter(s => 
      s.id.startsWith('visual_arts_') ||
      s.id.startsWith('design_tech_')
    )
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Subjects</h2>
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
          
          {Object.entries(groupedSubjects).map(([category, subjectList]) => (
            <div key={category} className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-2">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjectList.map(subject => (
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
          ))}
        </div>
      )}
    </div>
  );
};

// Paper Tracking Component with TZ support
const PaperTracking = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [completionStatus, setCompletionStatus] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([
    // Group 1: Studies in Language and Literature
    { id: 'english_a_sl', name: 'English A Lit SL', group: 1 },
    { id: 'english_a_hl', name: 'English A Lit HL', group: 1 },
    { id: 'german_a_sl', name: 'German A Lang & Lit SL', group: 1 },
    { id: 'german_a_hl', name: 'German A Lang & Lit HL', group: 1 },
    
    // Group 2: Language Acquisition
    { id: 'english_b_sl', name: 'English B SL', group: 2 },
    { id: 'english_b_hl', name: 'English B HL', group: 2 },
    { id: 'french_b_sl', name: 'French B SL', group: 2 },
    { id: 'french_b_hl', name: 'French B HL', group: 2 },
    { id: 'spanish_b_sl', name: 'Spanish B SL', group: 2 },
    { id: 'spanish_b_hl', name: 'Spanish B HL', group: 2 },
    { id: 'german_b_sl', name: 'German B SL', group: 2 },
    { id: 'german_b_hl', name: 'German B HL', group: 2 },
    
    // Group 3: Individuals and Societies
    { id: 'economics_sl', name: 'Economics SL', group: 3 },
    { id: 'economics_hl', name: 'Economics HL', group: 3 },
    { id: 'history_sl', name: 'History SL', group: 3 },
    { id: 'history_hl', name: 'History HL', group: 3 },
    { id: 'psychology_sl', name: 'Psychology SL', group: 3 },
    { id: 'psychology_hl', name: 'Psychology HL', group: 3 },
    { id: 'geography_sl', name: 'Geography SL', group: 3 },
    { id: 'geography_hl', name: 'Geography HL', group: 3 },
    { id: 'ess_sl', name: 'Environmental Systems & Societies SL', group: 3 },
    
    // Group 4: Sciences
    { id: 'physics_sl', name: 'Physics SL', group: 4 },
    { id: 'physics_hl', name: 'Physics HL', group: 4 },
    { id: 'chemistry_sl', name: 'Chemistry SL', group: 4 },
    { id: 'chemistry_hl', name: 'Chemistry HL', group: 4 },
    { id: 'biology_sl', name: 'Biology SL', group: 4 },
    { id: 'biology_hl', name: 'Biology HL', group: 4 },
    { id: 'computer_science_sl', name: 'Computer Science SL', group: 4 },
    { id: 'computer_science_hl', name: 'Computer Science HL', group: 4 },
    
    // Group 5: Mathematics
    { id: 'math_aa_sl', name: 'Mathematics AA SL', group: 5 },
    { id: 'math_aa_hl', name: 'Mathematics AA HL', group: 5 },
    { id: 'math_ai_sl', name: 'Mathematics AI SL', group: 5 },
    { id: 'math_ai_hl', name: 'Mathematics AI HL', group: 5 },
    
    // Group 6: The Arts
    { id: 'visual_arts_sl', name: 'Visual Arts SL', group: 6 },
    { id: 'visual_arts_hl', name: 'Visual Arts HL', group: 6 },
    { id: 'design_tech_sl', name: 'Design Technology SL', group: 6 },
    { id: 'design_tech_hl', name: 'Design Technology HL', group: 6 }
  ]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // New state for tracking expanded rows
  const [expandedRows, setExpandedRows] = useState({});
  
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const sessions = ['May', 'November'];
  const papers = ['Paper 1', 'Paper 2', 'Paper 3'];
  const timezones = ['TZ1', 'TZ2'];

  // Toggle row expansion
  const toggleRowExpansion = (rowKey) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };
  
  // Check if this selected subject has any papers with TZ variants
  const subjectHasAnyTZVariants = selectedSubject ? subjectHasTZVariants(selectedSubject) : false;

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

  const updatePaperStatus = (subject, year, session, paper, timezone, isCompleted) => {
    // Create a status key that includes timezone if it exists
    const statusKey = timezone 
      ? `${subject}-${year}-${session}-${paper}-${timezone}`
      : `${subject}-${year}-${session}-${paper}`;
    
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
      timezone: timezone || null,
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
        setTimeout(() => setError(''), 3000);
      });
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  };

  const getPaperStatus = (subject, year, session, paper, timezone) => {
    // Create a status key that includes timezone if it exists
    const key = timezone 
      ? `${subject}-${year}-${session}-${paper}-${timezone}`
      : `${subject}-${year}-${session}-${paper}`;
    
    return completionStatus[key] || false;
  };
  
  // Calculate combined status for papers with TZ variants
  const getCombinedStatus = (subject, year, session, paper) => {
    if (!hasTZVariants(subject, paper)) {
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
        // Determine which papers to check based on subject level
        const papersCount = selectedSubject.includes('_hl') ? 3 : 2;
        
        for (let i = 0; i < papersCount; i++) {
          const paper = papers[i];
          
          // Check if this paper has TZ variants
          if (hasTZVariants(selectedSubject, paper)) {
            // Count each timezone variant
            timezones.forEach(timezone => {
              total++;
              if (getPaperStatus(selectedSubject, year, session, paper, timezone)) {
                completed++;
              }
            });
          } else {
            // Count only the single paper
            total++;
            if (getPaperStatus(selectedSubject, year, session, paper)) {
              completed++;
            }
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
          
          {/* Show a note about TZ variants if applicable */}
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
                  <th className="w-10"></th> {/* Expansion control column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  {papers.slice(0, selectedSubject.includes('_hl') ? 3 : 2).map(paper => (
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
                    // Check if any paper in this row has TZ variants
                    const rowHasTZVariants = papers
                      .slice(0, selectedSubject.includes('_hl') ? 3 : 2)
                      .some(paper => hasTZVariants(selectedSubject, paper));
                    
                    return (
                      <React.Fragment key={rowKey}>
                        {/* Main row */}
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
                          
                          {/* Show status for each paper */}
                          {papers.slice(0, selectedSubject.includes('_hl') ? 3 : 2).map(paper => {
                            const paperHasTZ = hasTZVariants(selectedSubject, paper);
                            const status = getCombinedStatus(selectedSubject, year, session, paper);
                            
                            if (paperHasTZ) {
                              // For papers with TZ variants, show status indicator
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
                              // For papers without TZ variants, show regular checkbox
                              return (
                                <td key={`${rowKey}-${paper}`} className="px-6 py-4 whitespace-nowrap">
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                      checked={getPaperStatus(selectedSubject, year, session, paper)}
                                      onChange={() => updatePaperStatus(
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
                                </td>
                              );
                            }
                          })}
                        </tr>
                        
                        {/* Expanded row for TZ variants */}
                        {isExpanded && rowHasTZVariants && (
                          <tr className={sessionIndex % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50'}>
                            <td></td>
                            <td colSpan="2" className="px-6 py-3 text-sm text-gray-500 text-right">
                              <span className="font-medium">Timezone Variants:</span>
                            </td>
                            
                            {papers.slice(0, selectedSubject.includes('_hl') ? 3 : 2).map(paper => {
                              if (hasTZVariants(selectedSubject, paper)) {
                                return (
                                  <td key={`${rowKey}-${paper}-tz`} className="px-6 py-3">
                                    <div className="flex flex-col space-y-2">
                                      {/* TZ1 Checkbox */}
                                      <label className="inline-flex items-center">
                                        <input
                                          type="checkbox"
                                          className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                          checked={getPaperStatus(selectedSubject, year, session, paper, 'TZ1')}
                                          onChange={() => updatePaperStatus(
                                            selectedSubject,
                                            year,
                                            session,
                                            paper,
                                            'TZ1',
                                            getPaperStatus(selectedSubject, year, session, paper, 'TZ1')
                                          )}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">TZ1</span>
                                      </label>
                                      
                                      {/* TZ2 Checkbox */}
                                      <label className="inline-flex items-center">
                                        <input
                                          type="checkbox"
                                          className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                          checked={getPaperStatus(selectedSubject, year, session, paper, 'TZ2')}
                                          onChange={() => updatePaperStatus(
                                            selectedSubject,
                                            year,
                                            session,
                                            paper,
                                            'TZ2',
                                            getPaperStatus(selectedSubject, year, session, paper, 'TZ2')
                                          )}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">TZ2</span>
                                      </label>
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