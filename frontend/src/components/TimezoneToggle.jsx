import React from 'react';
import { useTimezoneConfig } from '../contexts/TimezoneContext';

const TimezoneToggle = ({ subjectId, paper }) => {
  const { 
    tzConfig, 
    userTimezoneOverrides, 
    updateUserTimezoneOverride 
  } = useTimezoneConfig();

  const paperKey = paper.toLowerCase().replace(' ', '');
  
  // Check if default config has timezone
  const defaultHasTimezone = tzConfig[subjectId]?.[paperKey] || false;
  
  // Check if user has an override
  const hasUserOverride = userTimezoneOverrides[subjectId]?.[paperKey] !== undefined;
  
  // Use override if exists, otherwise use default
  const timezoneEnabled = hasUserOverride 
    ? userTimezoneOverrides[subjectId][paperKey] 
    : defaultHasTimezone;

  const handleToggleChange = () => {
    updateUserTimezoneOverride(subjectId, paperKey, !timezoneEnabled);
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={timezoneEnabled}
          onChange={handleToggleChange}
          className="sr-only peer"
        />
        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Timezone</span>
      </label>
    </div>
  );
};

export default TimezoneToggle;