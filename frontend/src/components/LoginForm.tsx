import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import api from '../utils/axios';

interface LoginFormProps {
  onLogin: (token: string, username: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = tab === 0 ? '/login' : '/register';
      const response = await api.post(`${endpoint}`, {
        username,
        password,
      });

      if (tab === 0 && response.data.access_token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', response.data.username);
        
        // Update auth state via callback
        onLogin(response.data.access_token, response.data.username);
      } else if (tab === 1 && response.data.message) {
        // Registration successful
        setTab(0);
        setUsername('');
        setPassword('');
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
      </Box>
    </Box>
  );
}