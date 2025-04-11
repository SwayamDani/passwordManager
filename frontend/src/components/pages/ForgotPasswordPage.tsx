"use client"

// src/components/pages/ForgotPasswordPage.tsx
import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button,
  CssBaseline, 
  ThemeProvider,
  Toolbar
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { theme } from '@/theme';
import ForgotPassword from '@/components/features/auth/ForgotPassword';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const handleBackToLogin = () => {
    router.push('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
            elevation={4}
            sx={{ 
              p: 4, 
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
                Reset Password
              </Typography>
              <Typography component="h2" variant="subtitle1" align="center" color="text.secondary" paragraph>
                Enter your username and email to receive a reset link
              </Typography>
            </Box>
            
            <ForgotPassword />
            
            <Button 
              fullWidth 
              onClick={handleBackToLogin}
              sx={{ mt: 3 }}
            >
              Back to Login
            </Button>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}