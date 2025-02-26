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
import axios from 'axios';

interface LoginFormProps {
  onLogin: () => void;
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
      const endpoint = tab === 0 ? '/api/login' : '/api/register';
      const response = await axios.post(`http://localhost:8000${endpoint}`, {
        username,
        password,
      });

      if (response.data.success) {
        if (tab === 0) {
          onLogin();
        } else {
          setTab(0);
          setUsername('');
          setPassword('');
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'An error occurred');
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