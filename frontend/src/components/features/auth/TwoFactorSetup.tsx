import React, { useState, useEffect } from 'react';
import { 
   Box, Button, TextField, Typography, Alert, Paper,
  CircularProgress, Stepper, Step, StepLabel
} from '@mui/material';
import api from '@/utils/axios';
import { useRouter } from 'next/navigation';

interface TwoFactorSetupProps {
  userId: number | string;
  onComplete?: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ userId, onComplete }) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const steps = ['Generate Secret', 'Scan QR Code', 'Verify Code'];

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to set up 2FA');
      return;
    }
  }, []);

  const generateSecret = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the API TOTP generate endpoint instead of auth/2fa/setup
      const response = await api.post('/api/totp/generate');
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setActiveStep(1); // Move to next step
    } catch (err: any) {
      console.error('2FA Setup Error:', err);
      // Provide more detailed error information
      let errorMessage = 'Failed to set up 2FA. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log out and log in again.';
        // Redirect to login if unauthorized
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          router.push('/');
        }, 3000);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    // Check if token exists before making the request
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Pass token in the request body
      await api.post('/api/totp/verify', { token: verificationCode });
      
      setSuccess(true);
      setActiveStep(2); // Move to final step
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      console.error('2FA Verification Error:', err);
      // Provide more detailed error information
      let errorMessage = 'Verification failed. Please check your code and try again.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Redirect to login after a delay
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          router.push('/');
        }, 3000);
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
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
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Set Up Two-Factor Authentication
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 2 }}>
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
    </Box>
  );
};

export default TwoFactorSetup;