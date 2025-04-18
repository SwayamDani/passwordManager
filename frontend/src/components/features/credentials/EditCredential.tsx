import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import api from '@/utils/axios';
import { Account } from '@/types/account';

// We'll need to import the password generator when it's moved to a UI component
// import PasswordGenerator from '@/components/ui/PasswordGenerator';

interface EditCredentialProps {
  open: boolean;
  onClose: () => void;
  onAccountUpdated: () => void;
  service: string;
  initialData: Account | undefined;
}

export default function EditCredential({ 
  open, 
  onClose, 
  onAccountUpdated, 
  service, 
  initialData 
}: EditCredentialProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [has2FA, setHas2FA] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isBreached, setIsBreached] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setHas2FA(initialData.has_2fa);
    }
  }, [initialData]);

  const handlePasswordChange = async (newPassword: string) => {
    setPassword(newPassword);
    if (newPassword) {
      try {
        const response = await api.post('password/check', {
          password: newPassword
        });
        setPasswordStrength(response.data.strength_score);
        setIsBreached(response.data.is_breached);
      } catch (error) {
        console.error('Error checking password:', error);
      }
    } else {
      setPasswordStrength(0);
      setIsBreached(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.put(`/accounts/${service}`, {
        service,
        username,
        password,
        has_2fa: has2FA,
      });
      
      if (response.data.message) {
        onAccountUpdated();
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        typeof error === 'object' && error && 'response' in error ? 
        (error.response as any)?.data?.detail || 'Failed to update account' : 
        'Failed to update account';
      setError(errorMessage);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Account - {service}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              type="text"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                margin="dense"
                label="New Password (leave blank to keep current)"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              <Button
                variant="outlined"
                onClick={() => setGeneratorOpen(true)}
                sx={{ mt: 2 }}
              >
                Generate
              </Button>
            </Box>
            {password && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip
                  label={`Strength: ${passwordStrength}/5`}
                  color={passwordStrength >= 4 ? 'success' : 'warning'}
                  icon={<SecurityIcon />}
                />
                {isBreached && (
                  <Chip
                    label="Found in data breach"
                    color="error"
                    icon={<WarningIcon />}
                  />
                )}
              </Box>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={has2FA}
                  onChange={(e) => setHas2FA(e.target.checked)}
                />
              }
              label="2FA Enabled"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Password generator component will be added here when moved to UI components */}
      {/* <PasswordGenerator
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onSelectPassword={(pwd) => handlePasswordChange(pwd)}
      /> */}
    </>
  );
}