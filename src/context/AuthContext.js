import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [nurse, setNurse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (nursePin, password) => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call — replace with your real backend endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock: accept any PIN that is 4+ digits and password 6+ chars
      if (nursePin.length >= 4 && password.length >= 6) {
        const mockNurse = {
          id: '1',
          pin: nursePin,
          name: 'Abena Mensah',
          role: 'Registered Nurse',
          avatar: null,
          agency: 'CareSense',
          badge: 'RN-' + nursePin,
          patientsCount: 5,
          visitsToday: 3,
          phone: '+233 24 456 7890',
        };
        setNurse(mockNurse);
        return { success: true };
      } else {
        setError('Invalid PIN or password. Please try again.');
        return { success: false };
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setNurse(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ nurse, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
