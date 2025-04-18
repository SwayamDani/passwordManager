import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import api from '@/utils/axios';

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/register', {
        username,
        password,
      });
      
      if (response.data.message) {
        setSuccess(true);
        
        // Show success message for 2 seconds, then redirect to login
        setTimeout(() => {
          onSuccess(); // Redirect to login after success
        }, 2000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1">
            Registration successful! You'll be redirected to the login page.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            After login, you'll be prompted to set up your email and two-factor authentication.
          </Typography>
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
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
          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
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
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </Box>
      )}
    </Box>
  );
}