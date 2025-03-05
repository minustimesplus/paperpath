import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://papertrackerforib.onrender.com';
const TimezoneConfigContext = createContext({});

export const useTimezoneConfig = () => {
  return useContext(TimezoneConfigContext);
};

export const TimezoneConfigProvider = ({ children }) => {
  const [tzConfig, setTzConfig] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch timezone configuration from the API
    axios.get(`${API_URL}/timezone-config`)
      .then(response => {
        setTzConfig(response.data.timezone_config || {});
      })
      .catch(err => {
        console.error('Failed to load timezone configuration:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  return (
    <TimezoneConfigContext.Provider value={{ tzConfig, loading }}>
      {children}
    </TimezoneConfigContext.Provider>
  );
};