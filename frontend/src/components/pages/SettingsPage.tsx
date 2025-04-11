// src/components/pages/SettingsPage.tsx
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
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Card,
  CardContent,
  Stack,
  useTheme,
  IconButton,
  InputAdornment,
  Toolbar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon, 
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ColorLens as ColorLensIcon,
  Language as LanguageIcon,
  AccountCircle as AccountCircleIcon,
  ArrowBack as ArrowBackIcon,
  KeyboardBackspace as KeyboardBackspaceIcon,
  Check as CheckIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import AppHeader from '@/components/layouts/AppHeader';
import api from '@/utils/axios';

export default function SettingsPage() {
  const theme = useTheme();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Security settings
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showPasswordCheckDialog, setShowPasswordCheckDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showSetup2FADialog, setShowSetup2FADialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [passwordExpiryReminders, setPasswordExpiryReminders] = useState(true);
  const [dataBreachAlerts, setDataBreachAlerts] = useState(true);
  
  // Appearance settings
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);
  
  // Session settings
  const [autoLogoutTime, setAutoLogoutTime] = useState(30);
  const [rememberDevice, setRememberDevice] = useState(false);
  
  // Check authentication and load user settings
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLoginPage'));
      return;
    }
    
    setUsername(storedUsername);
    
    // Fetch user's settings
    const fetchUserSettings = async () => {
      try {
        setIsLoading(true);
        
        // Make an actual API call with proper error handling in axios interceptor
        const response = await api.get('/api/user/settings');
        
        // Use real data from API or fallback values if not available
        if (response.data) {
          setIs2FAEnabled(response.data.totp_enabled || false);
          setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        
        setIsLoading(false);
      } catch (err) {
        // Error handling is now in the axios interceptor
        // This will only be triggered for non-401 errors
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchUserSettings();
  }, []);
  
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real application, you would call your API
      // await api.post('/api/user/change-password', {
      //   current_password: currentPassword,
      //   new_password: newPassword
      // });
      
      // Mock successful password change
      setTimeout(() => {
        setSuccess('Password changed successfully');
        setShowChangePasswordDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 1000);
      
    } catch (err) {
      console.error('Failed to change password:', err);
      setError('Failed to change password. Please check your current password and try again.');
      setIsLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      // Make an actual API call
      await api.put('/api/user/settings', {
        darkMode,
        compactView,
        emailNotifications,
        securityAlerts,
        passwordExpiryReminders,
        dataBreachAlerts,
        autoLogoutTime,
        rememberDevice
      });
      
      setSuccess('Settings saved successfully');
      setIsLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again later.');
      setIsLoading(false);
    }
  };
  
  const handle2FAToggle = () => {
    if (is2FAEnabled) {
      setShowDisable2FADialog(true);
    } else {
      setShowSetup2FADialog(true);
    }
  };
  
  const handleDisable2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real application, you would call your API
      // await api.post('/api/user/disable-2fa', { token: totpCode });
      
      // Mock successful 2FA disabling
      setTimeout(() => {
        setIs2FAEnabled(false);
        setShowDisable2FADialog(false);
        setTotpCode('');
        setSuccess('Two-factor authentication disabled successfully');
        setIsLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
      setError('Failed to disable two-factor authentication. Please check your verification code and try again.');
      setIsLoading(false);
    }
  };
  
  const handleSetup2FA = async () => {
    // Mock successful 2FA setup
    setIs2FAEnabled(true);
    setShowSetup2FADialog(false);
    setSuccess('Two-factor authentication enabled successfully');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
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
        username={username || ""} 
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
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account settings and preferences
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
            <Paper sx={{ mb: 3 }}>
              <List component="nav" sx={{ p: 0 }}>
                <ListItem sx={{ bgcolor: 'primary.main', color: 'white' }}>
                  <ListItemIcon>
                    <AccountCircleIcon sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="h6">
                        {username}
                      </Typography>
                    } 
                  />
                </ListItem>
                
                <ListItem button onClick={() => window.dispatchEvent(new CustomEvent('openProfilePage'))}>
                  <ListItemIcon>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography fontWeight="bold">
                        Security
                      </Typography>
                    } 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography fontWeight="bold">
                        Notifications
                      </Typography>
                    } 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ColorLensIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography fontWeight="bold">
                        Appearance
                      </Typography>
                    } 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography fontWeight="bold">
                        Session
                      </Typography>
                    } 
                  />
                </ListItem>
              </List>
            </Paper>
            
            <Card sx={{ mb: 3, bgcolor: theme.palette.primary.dark, color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Security Status
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {is2FAEnabled ? (
                      <CheckIcon sx={{ mr: 1, color: 'success.light' }} />
                    ) : (
                      <VisibilityOffIcon sx={{ mr: 1, color: 'warning.light' }} />
                    )}
                    <Typography>
                      Two-Factor Authentication: {is2FAEnabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckIcon sx={{ mr: 1, color: 'success.light' }} />
                    <Typography>
                      Password: Strong
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckIcon sx={{ mr: 1, color: 'success.light' }} />
                    <Typography>
                      Last Login: April 10, 2025
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            
            <Button 
              variant="contained" 
              color="error" 
              fullWidth
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Grid>
          
          <Grid item xs={12} md={8}>
            {/* Security Settings */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Security Settings
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Two-Factor Authentication
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {is2FAEnabled 
                          ? 'Your account is secured with an additional authentication factor.' 
                          : 'Add an extra layer of security to your account.'}
                      </Typography>
                    </Box>
                    
                    <Switch
                      checked={is2FAEnabled}
                      onChange={handle2FAToggle}
                      color="primary"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Change Password
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        It's a good security practice to change your password regularly.
                      </Typography>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      onClick={() => setShowChangePasswordDialog(true)}
                      startIcon={<LockResetIcon />}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Notification Settings */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Notification Settings
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Email Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receive email notifications for important account activities.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securityAlerts}
                        onChange={(e) => setSecurityAlerts(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Security Alerts
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Get notified about suspicious activities on your account.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={passwordExpiryReminders}
                        onChange={(e) => setPasswordExpiryReminders(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Password Expiry Reminders
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Get reminders when your passwords need to be updated.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dataBreachAlerts}
                        onChange={(e) => setDataBreachAlerts(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Data Breach Alerts
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Get notified if your credentials appear in known data breaches.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save Settings'}
                </Button>
              </Box>
            </Paper>
            
            {/* Appearance Settings */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Appearance Settings
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Dark Mode
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Use dark theme for the application.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={compactView}
                        onChange={(e) => setCompactView(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Compact View
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Show more information in less space.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save Settings'}
                </Button>
              </Box>
            </Paper>
            
            {/* Session Settings */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Session Settings
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Auto Logout Time (minutes)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Set how long you can be inactive before automatically logging out.
                  </Typography>
                  <TextField
                    type="number"
                    value={autoLogoutTime}
                    onChange={(e) => setAutoLogoutTime(parseInt(e.target.value) || 30)}
                    InputProps={{ inputProps: { min: 5, max: 120 } }}
                    sx={{ width: 150 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Remember This Device
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stay logged in on this device even after closing the browser.
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'flex', ml: 0 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save Settings'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Change Password Dialog */}
        <Dialog 
          open={showChangePasswordDialog} 
          onClose={() => setShowChangePasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="Confirm New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={confirmPassword !== '' && newPassword !== confirmPassword}
                helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowChangePasswordDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleChangePassword} 
              variant="contained" 
              color="primary"
              disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Setup 2FA Dialog */}
        <Dialog 
          open={showSetup2FADialog} 
          onClose={() => setShowSetup2FADialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Setting up two-factor authentication adds an extra layer of security to your account.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 3 }}>
              <Box sx={{ 
                width: 200, 
                height: 200, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}>
                <QrCodeIcon sx={{ fontSize: 120, color: 'text.secondary' }} />
              </Box>
              
              <Typography variant="subtitle1" fontWeight="medium">
                Scan this QR code with your authenticator app
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Recommended apps: Google Authenticator, Authy, Microsoft Authenticator
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Enter the verification code from your app:
            </Typography>
            
            <TextField
              fullWidth
              label="6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSetup2FADialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSetup2FA} 
              variant="contained" 
              color="primary"
              disabled={totpCode.length !== 6}
            >
              Activate 2FA
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Disable 2FA Dialog */}
        <Dialog 
          open={showDisable2FADialog} 
          onClose={() => setShowDisable2FADialog(false)}
        >
          <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Please enter the verification code from your authenticator app to confirm disabling two-factor authentication.
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Warning: This will make your account less secure.
            </Alert>
            
            <TextField
              autoFocus
              margin="dense"
              label="6-digit code"
              fullWidth
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDisable2FADialog(false)}>Cancel</Button>
            <Button 
              onClick={handleDisable2FA}
              color="error"
              variant="contained"
              disabled={totpCode.length !== 6}
            >
              Disable 2FA
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}