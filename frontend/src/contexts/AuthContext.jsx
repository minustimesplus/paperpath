import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
// test
const API_URL = 'https://papertrackerforib.onrender.com';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [localCompletionStatus, setLocalCompletionStatus] = useState(
    JSON.parse(localStorage.getItem('localCompletionStatus') || '{}')
  );
  const [localSubjects, setLocalSubjects] = useState(
    JSON.parse(localStorage.getItem('localSubjects') || '[]')
  );

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  // Save local completion status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('localCompletionStatus', JSON.stringify(localCompletionStatus));
  }, [localCompletionStatus]);

  // Save local subjects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('localSubjects', JSON.stringify(localSubjects));
  }, [localSubjects]);

  const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/token`, formData);
    const accessToken = response.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    return response;
  };

  const register = async (username, email, password) => {
    try {
      // First register the user
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });
      const accessToken = response.data.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);

      // Then sync local data with the new account
      const syncPromises = [];

      if (Object.keys(localCompletionStatus).length > 0) {
        // Use the new bulk completion endpoint
        syncPromises.push(
          axios.post(
            `${API_URL}/completion/bulk`,
            { completion_data: localCompletionStatus },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
        );
      }

      if (localSubjects.length > 0) {
        syncPromises.push(
          axios.post(
            `${API_URL}/subjects`,
            { subjects: localSubjects },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
        );
      }

      // Wait for all sync operations to complete
      if (syncPromises.length > 0) {
        try {
          await Promise.all(syncPromises);
        } catch (error) {
          console.error('Error syncing local data:', error);
          // Even if sync fails, we continue since the user is registered
        }
      }

      // Clear local storage after successful sync
      setLocalCompletionStatus({});
      setLocalSubjects([]);
      localStorage.removeItem('localCompletionStatus');
      localStorage.removeItem('localSubjects');

      return response;
    } catch (error) {
      // If registration fails, don't clear local data
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    token,
    localCompletionStatus,
    setLocalCompletionStatus,
    localSubjects,
    setLocalSubjects
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};