import React, { useState } from 'react';
import { useTimezoneConfig } from '../contexts/TimezoneContext';

const TimezoneToggle = ({ subjectId }) => {
  const { 
    tzConfig, 
    userTimezoneOverrides, 
    updateUserTimezoneOverride 
  } = useTimezoneConfig();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Get papers for the selected subject
  const papers = subjectId && tzConfig[subjectId] 
    ? Object.keys(tzConfig[subjectId])
        .filter(key => key.startsWith('paper'))
        .map(key => ({
          id: key,
          name: `Paper ${key.charAt(5)}`,
          defaultHasTimezone: tzConfig[subjectId][key] || false,
          hasUserOverride: userTimezoneOverrides[subjectId]?.[key] !== undefined,
          timezoneEnabled: userTimezoneOverrides[subjectId]?.[key] !== undefined 
            ? userTimezoneOverrides[subjectId][key] 
            : (tzConfig[subjectId][key] || false)
        }))
    : [];

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleToggleChange = (paperKey, enabled) => {
    updateUserTimezoneOverride(subjectId, paperKey, enabled);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
      >
        <svg
          className="h-4 w-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Timezone Settings {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1 px-3" role="none">
            <div className="py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable timezone variants (TZ1/TZ2) for papers:
              </p>
            </div>

            <div className="py-2">
              {papers.map((paper) => (
                <div key={paper.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {paper.name}
                    {paper.defaultHasTimezone && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        (Default: Enabled)
                      </span>
                    )}
                  </span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paper.timezoneEnabled}
                      onChange={() => handleToggleChange(paper.id, !paper.timezoneEnabled)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
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

export default TimezoneToggle;