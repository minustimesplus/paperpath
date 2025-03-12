import React, { createContext, useContext, useState, useEffect } from 'react';
import timezoneConfig from '../timezone-config.json';

const TimezoneConfigContext = createContext({});

export const useTimezoneConfig = () => {
  return useContext(TimezoneConfigContext);
};

// Default year range for all subjects
const DEFAULT_YEAR_RANGE = {
  startYear: 2019,
  endYear: 2024
};

// All possible years that can be selected
export const AVAILABLE_YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

export const TimezoneConfigProvider = ({ children }) => {
  const [tzConfig, setTzConfig] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Store year ranges for each subject
  const [yearRanges, setYearRanges] = useState(() => {
    const savedRanges = localStorage.getItem('subjectYearRanges');
    return savedRanges ? JSON.parse(savedRanges) : {};
  });
  
  // Store user timezone overrides
  const [userTimezoneOverrides, setUserTimezoneOverrides] = useState(() => {
    const savedOverrides = localStorage.getItem('userTimezoneOverrides');
    return savedOverrides ? JSON.parse(savedOverrides) : {};
  });
  
  // Update year range for a specific subject
  const updateYearRange = (subjectId, startYear, endYear) => {
    setYearRanges(prev => {
      const newRanges = {
        ...prev,
        [subjectId]: { startYear, endYear }
      };
      localStorage.setItem('subjectYearRanges', JSON.stringify(newRanges));
      return newRanges;
    });
  };
  
  // Update user timezone override for a specific subject and paper
  const updateUserTimezoneOverride = (subjectId, paperKey, enabled) => {
    setUserTimezoneOverrides(prev => {
      // Create a deep copy of the previous state
      const newOverrides = { ...prev };
      
      // Initialize subject if it doesn't exist
      if (!newOverrides[subjectId]) {
        newOverrides[subjectId] = {};
      }
      
      // Update the paper's timezone setting
      newOverrides[subjectId][paperKey] = enabled;
      
      // Save to localStorage
      localStorage.setItem('userTimezoneOverrides', JSON.stringify(newOverrides));
      
      return newOverrides;
    });
  };
  
  // Get the effective timezone setting for a subject's paper
  const getEffectiveTimezoneSetting = (subjectId, paperKey) => {
    // Check if user has an override
    if (userTimezoneOverrides[subjectId]?.[paperKey] !== undefined) {
      return userTimezoneOverrides[subjectId][paperKey];
    }
    
    // Fallback to default configuration
    return tzConfig[subjectId]?.[paperKey] || false;
  };
  
  // Get year range for a specific subject (with fallback to default)
  const getYearRange = (subjectId) => {
    return yearRanges[subjectId] || DEFAULT_YEAR_RANGE;
  };
  
  useEffect(() => {
    // Make sure to initialize with an empty object if timezoneConfig is undefined
    setTzConfig(timezoneConfig || {});
    setLoading(false);
  }, []);
  
  const contextValue = {
    tzConfig, 
    loading,
    yearRanges,
    updateYearRange,
    getYearRange,
    DEFAULT_YEAR_RANGE,
    AVAILABLE_YEARS,
    userTimezoneOverrides,
    updateUserTimezoneOverride,
    getEffectiveTimezoneSetting
  };

  return (
    <TimezoneConfigContext.Provider value={contextValue}>
      {children}
    </TimezoneConfigContext.Provider>
  );
};