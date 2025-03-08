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
  
  // Get year range for a specific subject (with fallback to default)
  const getYearRange = (subjectId) => {
    return yearRanges[subjectId] || DEFAULT_YEAR_RANGE;
  };
  
  useEffect(() => {
    // Use local timezone configuration
    setTzConfig(timezoneConfig);
    setLoading(false);
  }, []);
  
  return (
    <TimezoneConfigContext.Provider value={{ 
      tzConfig, 
      loading,
      yearRanges,
      updateYearRange,
      getYearRange,
      DEFAULT_YEAR_RANGE,
      AVAILABLE_YEARS
    }}>
      {children}
    </TimezoneConfigContext.Provider>
  );
};