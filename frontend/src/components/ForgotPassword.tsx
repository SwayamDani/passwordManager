import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Container } from '@mui/material';
import api from '../utils/axios';

const ForgotPassword: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await api.post('/auth/forgot-password', { username_or_email: usernameOrEmail });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Forgot Password
        </Typography>

        {isSubmitted ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              If an account with that username or email exists, password reset instructions have been sent.
              Please check your email.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => window.location.href = '/'}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Enter your username or email address and we'll send you a link to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="usernameOrEmail"
              label="Username or Email"
              name="usernameOrEmail"
              autoComplete="username"
              autoFocus
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!usernameOrEmail}
            >
              Send Reset Link
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => window.location.href = '/'}
              sx={{ textTransform: 'none' }}
            >
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;