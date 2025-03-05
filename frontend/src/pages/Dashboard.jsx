import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SubjectSelection from '../components/SubjectSelection';
import PaperTracking from '../components/PaperTracking';
import logo from '../logo.svg';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [subjectsUpdated, setSubjectsUpdated] = useState(false);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex justify-between items-center">
          <div className="flex items-center">
            <img src={logo} alt="IB Paper Tracker Logo" className="h-20 w-30 mr-3" />
          </div>
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

export default Dashboard;