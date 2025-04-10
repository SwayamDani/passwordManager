'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import AuthModule from '@/components/features/auth/AuthModule';
import Dashboard from '@/components/layouts/Dashboard';
import { theme } from '@/theme';
import api from '@/utils/axios';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (storedToken) {
      setToken(storedToken);
      setUsername(storedUsername || '');
      setIsAuthenticated(true);
      
      // Set default Authorization header for all requests
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (newToken: string, newUsername: string) => {
    setToken(newToken);
    setUsername(newUsername);
    setIsAuthenticated(true);
    
    // Set default Authorization header for all requests
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setIsAuthenticated(false);
    
    // Remove token from localStorage and API headers
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    delete api.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          {isAuthenticated ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <AuthModule onLogin={handleLogin} />
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}