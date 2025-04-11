import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  TextField,
  Snackbar,
} from '@mui/material';
import api from '@/utils/axios';
import TwoFactorSetup from './TwoFactorSetup';

interface ProfileSetupPromptProps {
  open: boolean;
  onClose: () => void;
  userId: number | string;
}

export default function ProfileSetupPrompt({ open, onClose, userId }: ProfileSetupPromptProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{ username: string; email: string | null; totp_enabled: boolean }>({
    username: '',
    email: null,
    totp_enabled: false,
  });

  const steps = ['Email Setup', '2FA Setup'];

  // Fetch user settings when the component mounts
  useEffect(() => {
    if (open) {
      fetchUserSettings();
    }
  }, [open]);

  const fetchUserSettings = async () => {
    try {
      const response = await api.get('/api/user/settings');
      setProfile(response.data);

      // Determine which step to show first
      if (response.data.email) {
        setActiveStep(response.data.totp_enabled ? 2 : 1);
      } else {
        setActiveStep(0);
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      setError('Failed to load user settings. Please try again later.');
    }
  };

  const handleUpdateEmail = async () => {
    try {
      setError(''); // Clear any previous errors
      
      // Check email format
      if (!email || !email.includes('@') || !email.includes('.')) {
        setError('Please enter a valid email address.');
        return;
      }
      
      // Log the request for debugging
      console.log('Sending email update request:', { email });
      
      const response = await api.put('/api/user/email', { email });
      
      console.log('Email update response:', response.data);
      
      // If successful, proceed to next step
      setActiveStep(1);
      await fetchUserSettings();
    } catch (error: any) {
      // Detailed error handling
      console.error('Failed to update email:', error);
      
      // Extract the most useful error message
      let errorMessage = 'Failed to update email. Please try again.';
      
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        
        if (error.response.data && error.response.data.detail) {
          errorMessage = `Error: ${error.response.data.detail}`;
        } else if (error.response.status === 400) {
          errorMessage = 'Email address may already be in use or is invalid.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      setError(errorMessage);
    }
  };

  const handleTwoFactorComplete = () => {
    setSetupComplete(true);
    fetchUserSettings();
  };

  const handleClose = () => {
    if (setupComplete || profile.totp_enabled) {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Complete Your Profile Setup</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Adding your email address will allow you to reset your password if forgotten.
              </Typography>
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                Without an email address, you won't be able to recover your account if you forget your password.
              </Alert>
              <Box sx={{ mt: 2 }}>
                <TextField
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  label="Email Address"
                  fullWidth
                  margin="normal"
                  error={!!error}
                />
                <Button
                  variant="contained"
                  onClick={handleUpdateEmail}
                  disabled={!email.includes('@')}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Save Email
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Set up two-factor authentication to protect your account.
              </Typography>
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                Without 2FA setup, you won't be able to reset your password if you forget it.
              </Alert>
              <TwoFactorSetup userId={userId} onComplete={handleTwoFactorComplete} />
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                Your profile setup is complete! Your account is now secure.
              </Alert>
              <Typography variant="body1">
                You have successfully configured both your email address and two-factor authentication.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {activeStep < 2 && (
          <Button onClick={handleSkip} color="inherit">
            Skip for now
          </Button>
        )}
        {activeStep === 2 && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}