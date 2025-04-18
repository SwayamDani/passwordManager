// src/components/features/credentials/CredentialCard.tsx
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Fade,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Launch as LaunchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface CredentialCardProps {
  service: string;
  username: string;
  password: string;
  onClose: () => void;
}

export default function CredentialCard({ service, username, password, onClose }: CredentialCardProps) {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [bothCopied, setBothCopied] = useState(false);

  const copyUsername = async () => {
    await navigator.clipboard.writeText(username);
    setUsernameCopied(true);
    setTimeout(() => setUsernameCopied(false), 2000);
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const copyBoth = async () => {
    await navigator.clipboard.writeText(`${username}\t${password}`);
    setBothCopied(true);
    setTimeout(() => setBothCopied(false), 2000);
  };

  // Try to extract domain from service name for website link
  const getLaunchURL = () => {
    // Simple heuristic to guess the URL - this could be improved
    let serviceLower = service.toLowerCase();
    
    // Remove common suffixes
    ['app', 'login', 'account'].forEach(suffix => {
      if (serviceLower.endsWith(suffix)) {
        serviceLower = serviceLower.substring(0, serviceLower.length - suffix.length);
      }
    });
    
    // Add common domains for known services
    const knownServices: Record<string, string> = {
      'google': 'https://google.com',
      'gmail': 'https://gmail.com',
      'facebook': 'https://facebook.com',
      'twitter': 'https://twitter.com',
      'x': 'https://x.com',
      'instagram': 'https://instagram.com',
      'amazon': 'https://amazon.com',
      'netflix': 'https://netflix.com',
      'github': 'https://github.com',
      'linkedin': 'https://linkedin.com',
      'reddit': 'https://reddit.com'
    };
    
    if (knownServices[serviceLower]) {
      return knownServices[serviceLower];
    }
    
    // Try to construct a URL
    return `https://${serviceLower}.com`;
  };

  return (
    <Fade in={true}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '450px' },
          p: 0,
          zIndex: 1300,
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 3,
          pb: 2,
          bgcolor: theme.palette.primary.main,
          color: 'white'
        }}>
          <Typography variant="h5" component="div" fontWeight="medium">
            {service}
          </Typography>
          <Box>
            <Tooltip title="Visit website">
              <IconButton 
                onClick={() => window.open(getLaunchURL(), '_blank')}
                sx={{ color: 'white' }}
                size="small"
              >
                <LaunchIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton 
                onClick={onClose}
                sx={{ color: 'white', ml: 1 }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Username</Typography>
          <TextField
            fullWidth
            value={username}
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={copyUsername} edge="end" color={usernameCopied ? "success" : "default"}>
                    {usernameCopied ? <CheckIcon /> : <CopyIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Password</Typography>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={password}
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ mr: 0.5 }}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                  <IconButton onClick={copyPassword} edge="end" color={passwordCopied ? "success" : "default"}>
                    {passwordCopied ? <CheckIcon /> : <CopyIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="contained" 
              onClick={copyBoth}
              startIcon={bothCopied ? <CheckIcon /> : <CopyIcon />}
              color={bothCopied ? "success" : "primary"}
            >
              {bothCopied ? 'Copied!' : 'Copy Both'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}