import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Box,
} from '@mui/material';
import axios from 'axios';

interface AddAccountProps {
  open: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

export default function AddAccount({ open, onClose, onAccountAdded }: AddAccountProps) {
  const [service, setService] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [has2FA, setHas2FA] = useState(false);
  const [error, setError] = useState('');
  const [generatorOpen, setGeneratorOpen] = useState(false);  // Add this line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('https://deploy-preview-4--celadon-fairy-54d475.netlify.app/.netlify/functions/api/accounts', {
        service,
        username,
        password,
        has_2fa: has2FA,
      });

      if (response.data.success) {
        onAccountAdded();
        onClose();
        setService('');
        setUsername('');
        setPassword('');
        setHas2FA(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'Failed to add account' : 
        'Failed to add account';
      setError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Account</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              variant="outlined"
              onClick={() => setGeneratorOpen(true)}
              sx={{ mt: 2 }}
            >
              Generate
            </Button>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={has2FA}
                onChange={(e) => setHas2FA(e.target.checked)}
              />
            }
            label="2FA Enabled"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Add Account
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}