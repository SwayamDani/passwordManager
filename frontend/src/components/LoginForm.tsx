import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useRouter } from 'next/navigation'; // Changed from next/router to next/navigation
import api from '../utils/axios';

interface LoginFormProps {
  onLogin: (token: string, username: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (tab === 0) { // Login
        // First authenticate with username/password
        const response = await api.post('/api/login', {
          username,
          password,
        });

        // Check if 2FA is required
        if (response.data.status === '2fa_required') {
          setRequires2FA(true);
          setIs2FADialogOpen(true);
          return;
        }

        // If not, proceed with login
        if (response.data.access_token) {
          // Store token in localStorage
          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('username', response.data.username);
          
          // Update auth state via callback
          onLogin(response.data.access_token, response.data.username);
        }
      } else { // Register
        const registerResponse = await api.post('/api/register', {
          username,
          password,
        });
        
        if (registerResponse.data.message) {
          // Registration successful
          setTab(0);
          setUsername('');
          setPassword('');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    }
  };

  const handleVerify2FA = async () => {
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
        
        // Store token in localStorage
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('user_id', response.data.user_id);
        
        // Update auth state via callback
        onLogin(response.data.access_token, response.data.username);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'Invalid authentication code' : 
        'Invalid authentication code';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>
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
        />
        <TextField
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
        />
        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{ mt: 3 }}
        >
          {tab === 0 ? 'Login' : 'Register'}
        </Button>
        
        {tab === 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link 
              component="button"
              variant="body2"
              onClick={handleForgotPassword}
              sx={{ cursor: 'pointer' }}
            >
              Forgot password?
            </Link>
          </Box>
        )}
      </Box>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={is2FADialogOpen} onClose={() => setIs2FADialogOpen(false)}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIs2FADialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleVerify2FA}
            disabled={!totpCode || totpCode.length !== 6}
            variant="contained"
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}