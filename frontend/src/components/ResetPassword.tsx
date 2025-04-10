import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper, Container, CircularProgress } from '@mui/material';
import api from '../utils/axios';
import { useRouter } from 'next/router';

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [username, setUsername] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate the token once it's available from the URL
    if (token) {
      validateToken(token as string);
    }
  }, [token]);

  const validateToken = async (resetToken: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/reset-password/validate', { token: resetToken });
      setIsTokenValid(true);
      setRequires2FA(response.data.requires_2fa || false);
      setUsername(response.data.username || '');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired reset link');
      setIsTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await api.post('/auth/reset-password/complete', {
        token: token,
        new_password: newPassword,
        totp_code: requires2FA ? totpCode : undefined
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Validating reset token...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!isTokenValid) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Alert severity="error">
            {error || 'Invalid or expired reset link. Please request a new password reset.'}
          </Alert>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => router.push('/forgot-password')}
          >
            Request New Reset Link
          </Button>
        </Paper>
      </Container>
    );
  }

  if (isSubmitted) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Alert severity="success">
            Your password has been reset successfully!
          </Alert>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => router.push('/')}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Reset Password
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Hello {username}, please enter your new password below.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="newPassword"
            label="New Password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="confirmPassword"
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {requires2FA && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="totpCode"
              label="Authentication Code (from your authenticator app)"
              name="totpCode"
              autoComplete="off"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="6-digit code"
              inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={
              !newPassword || 
              !confirmPassword || 
              (requires2FA && !totpCode) || 
              newPassword !== confirmPassword
            }
          >
            Reset Password
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;