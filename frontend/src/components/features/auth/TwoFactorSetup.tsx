import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, Typography, Alert, Paper, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress,
  Stepper, Step, StepLabel
} from '@mui/material';
import api from '@/utils/axios';

interface TwoFactorSetupProps {
  userId: number;
  onComplete?: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ userId, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const steps = ['Generate Secret', 'Scan QR Code', 'Verify Code'];

  const generateSecret = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/2fa/setup', { user_id: userId });
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setActiveStep(1); // Move to next step
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set up 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/2fa/verify', { token: verificationCode });
      setSuccess(true);
      setActiveStep(2); // Move to final step
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed. Please check your code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically start the setup process when component mounts
  useEffect(() => {
    if (activeStep === 0 && !qrCode) {
      generateSecret();
    }
  }, []);

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Set Up Two-Factor Authentication
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center' }}>
            {isLoading ? (
              <CircularProgress />
            ) : (
              <>
                <Typography variant="body1" gutterBottom>
                  We're generating your secure 2FA key...
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={generateSecret} 
                  disabled={isLoading}
                >
                  Generate New Key
                </Button>
              </>
            )}
          </Box>
        )}

        {activeStep === 1 && qrCode && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </Typography>
            
            <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
              <img 
                src={qrCode} 
                alt="QR Code for 2FA" 
                style={{ maxWidth: '200px', margin: '0 auto' }} 
              />
            </Box>

            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              Or manually enter this code in your authenticator app:
            </Typography>
            
            <Box 
              sx={{ 
                background: '#f5f5f5', 
                p: 1, 
                borderRadius: 1, 
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}
            >
              {secret}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Enter the verification code from your authenticator app:
              </Typography>
              <TextField
                fullWidth
                label="6-digit code"
                variant="outlined"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                sx={{ mt: 1 }}
              />
              <Button 
                variant="contained" 
                onClick={verifySetup} 
                disabled={isLoading || verificationCode.length !== 6}
                sx={{ mt: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Verify & Activate'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && success && (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Two-factor authentication has been successfully enabled for your account!
            </Alert>
            <Typography variant="body1" gutterBottom>
              From now on, you'll need to provide a verification code from your authenticator app
              when you sign in or perform sensitive operations.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Important: Keep your recovery codes in a safe place in case you lose access to your authenticator app.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TwoFactorSetup;