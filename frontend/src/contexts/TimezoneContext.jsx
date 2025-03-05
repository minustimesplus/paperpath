import React, { createContext, useContext, useState, useEffect } from 'react';
import timezoneConfig from '../timezone-config.json';

const TimezoneConfigContext = createContext({});

export const useTimezoneConfig = () => {
  return useContext(TimezoneConfigContext);
};

export const TimezoneConfigProvider = ({ children }) => {
  const [tzConfig, setTzConfig] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Use local timezone configuration
    setTzConfig(timezoneConfig);
    setLoading(false);
  }, []);
  
  return (
    <TimezoneConfigContext.Provider value={{ tzConfig, loading }}>
      {children}
    </TimezoneConfigContext.Provider>
  );
};