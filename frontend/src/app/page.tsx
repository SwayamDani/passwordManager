// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  Typography,
  Container,
  Paper,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import AuthModule from '@/components/features/auth/AuthModule';
import AppNavigation from '@/components/layouts/AppNavigation';
import { theme } from '@/theme';
import api from '@/utils/axios';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    // Add event listener for logout events from components
    const handleLoginPage = () => {
      setIsAuthenticated(false);
      setToken('');
      setUsername('');
      // Remove token from localStorage and API headers
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      delete api.defaults.headers.common['Authorization'];
    };

    window.addEventListener('openLoginPage', handleLoginPage);
    
    return () => {
      window.removeEventListener('openLoginPage', handleLoginPage);
    };
  }, []);

  const handleLogin = (newToken: string, newUsername: string) => {
    setToken(newToken);
    setUsername(newUsername);
    setIsAuthenticated(true);
    
    // Set default Authorization header for all requests
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    // Store credentials in localStorage
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setIsAuthenticated(false);
    
    // Remove token from localStorage and API headers
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    delete api.defaults.headers.common['Authorization'];
    
    // Dispatch the event for consistency
    window.dispatchEvent(new CustomEvent('openLoginPage'));
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: 'background.default'
      }}>
        <LockIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
        <CircularProgress color="primary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your secure vault...
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated ? (
        <AppNavigation onLogout={handleLogout} />
      ) : (
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pt: 8,
            pb: 8,
          }}
        >
          <Container maxWidth="sm">
            <Paper 
              elevation={isMobile ? 0 : 4}
              sx={{ 
                p: 4, 
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: isMobile ? 'transparent' : 'background.paper'
              }}
            >
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4
              }}>
                <Box sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 64,
                  height: 64
                }}>
                  <LockIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography component="h1" variant="h4" align="center" fontWeight="bold" gutterBottom>
                  Password Security Assessment
                </Typography>
                <Typography component="h2" variant="subtitle1" align="center" color="text.secondary" paragraph>
                  Secure your online accounts with strong password management
                </Typography>
              </Box>
              
              <AuthModule onLogin={handleLogin} />
              
              <Box mt={4} width="100%">
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  By using this service, you agree to our Terms of Service and Privacy Policy.
                </Typography>
              </Box>
            </Paper>
            
            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} Password Security Assessment Tool
              </Typography>
            </Box>
          </Container>
        </Box>
      )}
    </ThemeProvider>
  )};