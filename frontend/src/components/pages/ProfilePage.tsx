// src/components/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Avatar, 
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  Toolbar,
  IconButton,
} from '@mui/material';
import { 
  Person as PersonIcon,
  Update as UpdateIcon,
  Check as CheckIcon,
  Key as KeyIcon,
  LockClock as LockClockIcon,
  Security as SecurityIcon,
  KeyboardBackspace as KeyboardBackspaceIcon,
} from '@mui/icons-material';
import AppHeader from '@/components/layouts/AppHeader';
import api from '@/utils/axios';

export default function ProfilePage() {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountCreationDate, setAccountCreationDate] = useState('');
  const [lastLoginDate, setLastLoginDate] = useState('');
  const [passwordLastChanged, setPasswordLastChanged] = useState('');
  
  // Mock statistics - in a real app, these would come from the API
  const [stats, setStats] = useState({
    totalAccounts: 0,
    accountsWith2FA: 0,
    passwordsUpdatedLast90Days: 0,
    averagePasswordStrength: 0,
  });
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLoginPage'));
      return;
    }
    
    setUsername(storedUsername || '');
    
    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // In a real application, you would fetch this from the API
        // const response = await api.get('/api/user/profile');
        
        // For now, let's use mock data
        setTimeout(() => {
          setEmail('user@example.com'); // This would come from the API
          setAccountCreationDate('January 15, 2024');
          setLastLoginDate('April 10, 2025');
          setPasswordLastChanged('March 5, 2025');
          
          // Mock statistics
          setStats({
            totalAccounts: 12,
            accountsWith2FA: 7,
            passwordsUpdatedLast90Days: 9,
            averagePasswordStrength: 3.8,
          });
          
          setIsLoading(false);
        }, 800);
        
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Failed to load your profile information. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // In a real application, you would update the profile via the API
      // await api.put('/api/user/profile', { email, other_fields });
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('Profile updated successfully');
        setIsLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update your profile. Please try again later.');
      setIsLoading(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent('openLoginPage'));
  };

  if (isLoading && !username) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader 
        username={username} 
        onLogout={handleLogout} 
        showMenuIcon={false}
      />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Toolbar />
        
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<KeyboardBackspaceIcon />} 
            onClick={() => window.dispatchEvent(new CustomEvent('openDashboardPage'))}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Your Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your personal information and account preferences
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: theme.palette.primary.main,
                    fontSize: '2.5rem',
                    mb: 2
                  }}
                >
                  {getInitials(username)}
                </Avatar>
                
                <Typography variant="h5" gutterBottom>
                  {username}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" align="center">
                  Password Manager User
                </Typography>
                
                <Button 
                  variant="outlined" 
                  startIcon={<KeyIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => window.dispatchEvent(new CustomEvent('openSettingsPage'))}
                >
                  Security Settings
                </Button>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {accountCreationDate}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Last Login
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {lastLoginDate}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Password Last Changed
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {passwordLastChanged}
                </Typography>
              </Box>
            </Paper>
            
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={() => window.dispatchEvent(new CustomEvent('openDashboardPage'))}
            >
              Back to Dashboard
            </Button>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper component="form" onSubmit={handleProfileUpdate} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Username"
                    value={username}
                    fullWidth
                    disabled
                    helperText="Username cannot be changed"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    required
                    type="email"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  startIcon={<UpdateIcon />}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Update Profile'}
                </Button>
              </Box>
            </Paper>
            
            <Typography variant="h6" gutterBottom>
              Account Statistics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                      Total Accounts
                    </Typography>
                    <Typography variant="h3" component="div" fontWeight="bold" color="primary">
                      {stats.totalAccounts}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Accounts managed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                      2FA Adoption
                    </Typography>
                    <Typography 
                      variant="h3" 
                      component="div" 
                      fontWeight="bold"
                      color="success.main"
                    >
                      {stats.totalAccounts ? Math.round((stats.accountsWith2FA / stats.totalAccounts) * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Accounts with two-factor authentication
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                      Recently Updated
                    </Typography>
                    <Typography 
                      variant="h3" 
                      component="div" 
                      fontWeight="bold"
                      color="info.main"
                    >
                      {stats.totalAccounts ? Math.round((stats.passwordsUpdatedLast90Days / stats.totalAccounts) * 100) : 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Passwords updated in the last 90 days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                      Password Strength
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                      <Typography 
                        variant="h3" 
                        component="div" 
                        fontWeight="bold"
                        color={
                          stats.averagePasswordStrength >= 4 ? 'success.main' :
                          stats.averagePasswordStrength >= 3 ? 'info.main' : 'warning.main'
                        }
                      >
                        {stats.averagePasswordStrength.toFixed(1)}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>/ 5</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Average password strength score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Paper sx={{ p: 3, mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Password Security Best Practices
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body1">
                    Use unique passwords for each account
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body1">
                    Enable two-factor authentication wherever possible
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body1">
                    Rotate passwords every 90 days for critical accounts
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body1">
                    Use passwords with at least 12 characters, including uppercase, lowercase, numbers, and symbols
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body1">
                    Regularly check for compromised passwords
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}