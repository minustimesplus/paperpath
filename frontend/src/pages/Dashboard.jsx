import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import SubjectSelection from '../components/SubjectSelection';
import PaperTracking from '../components/PaperTracking';
import DarkModeToggle from '../components/DarkModeToggle';
import logo from '../logo.svg';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [subjectsUpdated, setSubjectsUpdated] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSubjectsChange = () => {
    setSubjectsUpdated(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">IB Paper Tracker</h1>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <DarkModeToggle />
            {currentUser ? (
              <>
                <span className="text-gray-700 dark:text-gray-300 text-sm">Hello, {currentUser.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t dark:border-gray-700">
            <div className="flex justify-center py-2">
              <DarkModeToggle />
            </div>
            
            {currentUser ? (
              <>
                <div className="text-gray-700 dark:text-gray-300 text-center py-2">
                  Hello, {currentUser.username}
                </div>
                <div className="text-center py-2">
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2 py-2">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {!currentUser && showBanner && (
        <div className="bg-blue-50 dark:bg-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start sm:items-center mb-2 sm:mb-0">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Your progress is currently only saved in this browser. Create an account to save your progress securely!
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <button
                    onClick={() => setShowBanner(false)}
                    className="flex-shrink-0 rounded-md p-0.5 inline-flex text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <SubjectSelection onSubjectsChange={handleSubjectsChange} />
          <PaperTracking key={subjectsUpdated} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;