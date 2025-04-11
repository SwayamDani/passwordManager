"use client"

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress
} from '@mui/material';
import api, { setAuthToken } from '@/utils/axios';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onLogin: (token: string, username: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/login', {
        username,
        password,
      });

      // Check if 2FA is required
      if (response.data.status === '2fa_required') {
        setRequires2FA(true);
        setIs2FADialogOpen(true);
        setIsLoading(false);
        return;
      }

      // If not, proceed with login
      if (response.data.access_token) {
        // Use our enhanced helper function to ensure the token is properly set
        setAuthToken(response.data.access_token);
        
        // Store other user info in localStorage
        localStorage.setItem('username', response.data.username);
        
        // Store user_id if available
        if (response.data.user_id) {
          localStorage.setItem('user_id', response.data.user_id);
        }
        
        // Give the token a moment to be stored before making subsequent requests
        setTimeout(() => {
          // Update auth state via callback
          onLogin(response.data.access_token, response.data.username);
          
          // Verify token is working by making a test request
          api.get('/api/accounts')
            .then(() => console.debug('Authentication verified'))
            .catch(err => console.warn('Test request failed:', err));
            
          setIsLoading(false);
        }, 100);
      }
    } catch (error: unknown) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    }
  };

  const handleVerify2FA = async () => {
    setIsLoading(true);
    try {
      // Submit the TOTP code to complete login
      const response = await api.post('/auth/login', {
        username,
        password,
        totp_code: totpCode
      });

      if (response.data.access_token) {
        // Close dialog and reset state
        setIs2FADialogOpen(false);
        setTotpCode('');
        setRequires2FA(false);
        
        // Use our enhanced helper function to ensure the token is properly set
        setAuthToken(response.data.access_token);
        
        // Store other user info in localStorage
        localStorage.setItem('username', response.data.username);
        
        // Store user_id if available
        if (response.data.user_id) {
          localStorage.setItem('user_id', response.data.user_id);
        }
        
        // Give the token a moment to be stored before making subsequent requests
        setTimeout(() => {
          // Update auth state via callback
          onLogin(response.data.access_token, response.data.username);
          
          // Verify token is working by making a test request
          api.get('/api/accounts')
            .then(() => console.debug('Authentication verified'))
            .catch(err => console.warn('Test request failed:', err));
            
          setIsLoading(false);
        }, 100);
      }
    } catch (error: unknown) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'Invalid authentication code' : 
        'Invalid authentication code';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    // Navigate to the forgot password page using Next.js router
    router.push('/forgot-password');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        fullWidth
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
        required
        disabled={isLoading}
      />
      <TextField
        fullWidth
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        disabled={isLoading}
      />
      <Button
        fullWidth
        variant="contained"
        type="submit"
        sx={{ mt: 3 }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Login'}
      </Button>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link 
          component="button"
          variant="body2"
          onClick={handleForgotPassword}
          sx={{ cursor: 'pointer' }}
          disabled={isLoading}
        >
          Forgot password?
        </Link>
      </Box>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={is2FADialogOpen} onClose={() => !isLoading && setIs2FADialogOpen(false)}>
        <DialogTitle>Two-Factor Authentication Required</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter the verification code from your authenticator app.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="6-digit code"
            fullWidth
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIs2FADialogOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button 
            onClick={handleVerify2FA}
            disabled={!totpCode || totpCode.length !== 6 || isLoading}
            variant="contained"
          >
            {isLoading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}