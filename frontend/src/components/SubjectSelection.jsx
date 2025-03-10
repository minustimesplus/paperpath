import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getSubjectName, groupedSubjects } from '../config/subjectConfig';

const API_URL = 'https://papertrackerforib.onrender.com';

const SubjectSelection = ({ onSubjectsChange }) => {
  const { token, currentUser, localSubjects, setLocalSubjects } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      axios.get(`${API_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setSubjects(response.data.subjects || []);
        })
        .catch(err => {
          console.error('Error fetching subjects:', err);
        });
    } else {
      setSubjects(localSubjects);
    }
  }, [token, currentUser, localSubjects]);

  const toggleSubject = (subjectId) => {
    let newSubjects = subjects.includes(subjectId)
      ? subjects.filter(s => s !== subjectId)
      : [...subjects, subjectId];
    
    if (currentUser) {
      axios.post(`${API_URL}/subjects`, { subjects: newSubjects }, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          setSubjects(newSubjects);
          setError('');
          if (onSubjectsChange) onSubjectsChange();
        })
        .catch(err => {
          console.error('Error updating subjects:', err);
          setError('Failed to update subjects');
        });
    } else {
      setLocalSubjects(newSubjects);
      setSubjects(newSubjects);
      if (onSubjectsChange) onSubjectsChange();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Subjects</h2>
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
      
      {error && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Selected Subjects:</h3>
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <span key={subject} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded">
                {getSubjectName(subject)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">No subjects selected yet. Edit subjects to get started.</p>
        )}
      </div>
      
      {isDropdownOpen && (
        <div className="mt-6 border-t dark:border-gray-700 pt-4">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Select Your IB Subjects:</h3>
          
          {Object.entries(groupedSubjects).map(([category, subjectList]) => (
            <div key={category} className="mb-6">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjectList.map(subject => (
                  <div key={subject.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={subject.id}
                      checked={subjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor={subject.id} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
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

export default SubjectSelection;