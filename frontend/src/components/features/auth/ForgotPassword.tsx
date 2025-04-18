"use client"

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper
} from '@mui/material';
import api from '@/utils/axios';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await api.post('reset-password-request', {
        username_or_email: email || username // Use email if provided, otherwise use username
      });
      setSubmitted(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Reset Password
        </Typography>
        
        {submitted ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              If the username and email match our records, you will receive a password reset link shortly.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please check your email for instructions to reset your password.
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter your username and email address to receive a password reset link.
            </Typography>
            
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
            >
              Request Password Reset
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}