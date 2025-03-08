import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TimezoneConfigProvider } from './contexts/TimezoneContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <AuthProvider>
      <TimezoneConfigProvider>
        <DarkModeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Add a redirect from /dashboard to the main page */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </DarkModeProvider>
      </TimezoneConfigProvider>
    </AuthProvider>
  );
};

export default App;