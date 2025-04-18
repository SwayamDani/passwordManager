import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  LinearProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import api from '@/utils/axios';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL
    const query = new URLSearchParams(window.location.search);
    const tokenParam = query.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setLoading(false);
      setError('Invalid or missing reset token');
    }
  }, []);

  const validateToken = async (resetToken: string) => {
    try {
      await api.get(`/validate-reset-token/${resetToken}`);
      setTokenValid(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError('This password reset link is invalid or has expired');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await api.post('/reset-password', {
        token,
        new_password: password
      });
      setSuccess(true);
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Validating Reset Link
          </Typography>
          <LinearProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Reset Password
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your password has been reset successfully! You will be redirected to login.
          </Alert>
        ) : tokenValid ? (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter your new password below.
            </Typography>
            
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              error={confirmPassword !== '' && password !== confirmPassword}
              helperText={confirmPassword !== '' && password !== confirmPassword ? 'Passwords do not match' : ''}
            />
            
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
            >
              Reset Password
            </Button>
          </Box>
        ) : (
          <Typography variant="body1" color="error">
            This password reset link is invalid or has expired. Please request a new one.
          </Typography>
        )}
      </Paper>
    </Container>
  );
}