import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await api.post('/api/register', {
        username,
        password,
      });
      
      if (response.data.message) {
        setSuccess(true);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login tab after successful registration
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'An error occurred' : 
        'An error occurred';
      setError(errorMessage);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Registration successful! You can now login.
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
      >
        Register
      </Button>
    </Box>
  );
}