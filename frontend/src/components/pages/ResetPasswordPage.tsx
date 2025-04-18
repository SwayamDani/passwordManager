"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  LinearProgress,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import api from '@/utils/axios';
import { useRouter } from 'next/navigation';
import LockResetIcon from '@mui/icons-material/LockReset';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Extract token from URL
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get('token');

    // Check if token is available in the URL
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
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api.post('/reset-password', {
        token,
        new_password: password
      });
      
      setSuccess(true);
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          color: 'text.primary'
        }}>
          <LockResetIcon fontSize="large" sx={{ mb: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="500">
            Reset Password
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Validating Reset Link
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {success ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body1" fontWeight="500">
                    Your password has been reset successfully!
                  </Typography>
                  <Typography variant="body2">
                    Redirecting to login page...
                  </Typography>
                </Alert>
              ) : tokenValid ? (
                <Box component="form" onSubmit={handleSubmit}>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Please enter your new password below.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                    variant="outlined"
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
                    variant="outlined"
                  />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    type="submit"
                    sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Reset Password'}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      This password reset link is invalid or has expired.
                    </Typography>
                  </Alert>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => router.push('/forgot-password')}
                    sx={{ mt: 2 }}
                  >
                    Request New Reset Link
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Paper>
    </Container>
  );
}