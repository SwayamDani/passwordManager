'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import api from '../../utils/axios';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  
  // Check authentication and load user settings
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('user_id');
    
    if (!token || !storedUsername) {
      router.push('/');
      return;
    }
    
    setUsername(storedUsername);
    
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    }
    
    // Fetch user's 2FA status
    const fetchUserSettings = async () => {
      try {
        // Set authorization header for all requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/api/user/settings');
        setIs2FAEnabled(response.data.totp_enabled || false);
      } catch (err) {
        setError('Failed to load settings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [router]);
  
  const handleDisable2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    try {
      await api.post('/auth/2fa/disable', { token: totpCode });
      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setTotpCode('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disable 2FA. Invalid code.');
    }
  };
  
  const handleSetupComplete = () => {
    setShowSetupDialog(false);
    setIs2FAEnabled(true);
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Two-Factor Authentication
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="body1">
              Two-factor authentication is currently 
              <strong>{is2FAEnabled ? ' enabled' : ' disabled'}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {is2FAEnabled 
                ? 'Your account is secured with an additional authentication factor.' 
                : 'Add an extra layer of security to your account.'}
            </Typography>
          </Box>
          
          {is2FAEnabled ? (
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => setShowDisableDialog(true)}
            >
              Disable 2FA
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setShowSetupDialog(true)}
            >
              Set up 2FA
            </Button>
          )}
        </Box>
      </Paper>
      
      {/* User Profile Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Email Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add an email address to enable password recovery.
        </Typography>
        
        <TextField
          fullWidth
          label="Email Address"
          variant="outlined"
          placeholder="Enter your email address"
          helperText="This email will be used for password recovery"
          sx={{ mb: 2 }}
        />
        
        <Button variant="contained">
          Save Email
        </Button>
      </Paper>
      
      {/* 2FA Setup Dialog */}
      <Dialog 
        open={showSetupDialog} 
        onClose={() => setShowSetupDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogContent sx={{ p: 0 }}>
          {userId && <TwoFactorSetup userId={userId} onComplete={handleSetupComplete} />}
        </DialogContent>
      </Dialog>
      
      {/* 2FA Disable Dialog */}
      <Dialog 
        open={showDisableDialog} 
        onClose={() => setShowDisableDialog(false)}
      >
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter the verification code from your authenticator app to confirm.
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
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisableDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDisable2FA}
            color="error"
            variant="contained"
            disabled={!totpCode || totpCode.length !== 6}
          >
            Disable 2FA
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}