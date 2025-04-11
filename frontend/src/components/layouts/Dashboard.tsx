// src/components/layouts/Dashboard.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Backdrop,
  Snackbar,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Button,
  Card,
  CardContent,
  Divider,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '@/utils/axios';
import CredentialList from '@/components/features/credentials/CredentialList';
import SecurityScore from '@/components/features/security/SecurityScore';
import AddCredential from '@/components/features/credentials/AddCredential';
import EditCredential from '@/components/features/credentials/EditCredential';
import CredentialCard from '@/components/features/credentials/CredentialCard';
import ProfileSetupPrompt from '@/components/features/auth/ProfileSetupPrompt';
import { Account, AgingPassword, SecurityMetrics } from '@/types/account';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [username, setUsername] = useState('');
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [agingPasswords, setAgingPasswords] = useState<AgingPassword[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [clipboardMessage, setClipboardMessage] = useState('');
  const [credentialCardOpen, setCredentialCardOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<{
    service: string;
    username: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // New states for profile setup
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [userId, setUserId] = useState<number | string>('');
  const [userProfile, setUserProfile] = useState<{
    email: string | null;
    totp_enabled: boolean;
  }>({ email: null, totp_enabled: false });
  
  const isMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    // Get username and user_id from localStorage
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('user_id');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    fetchAccounts();
    fetchAgingPasswords();
    fetchUserProfile();

    // Handle the custom event for opening add account dialog
    const handleOpenAddDialog = () => setAddDialogOpen(true);
    window.addEventListener('openAddAccountDialog', handleOpenAddDialog);

    return () => {
      window.removeEventListener('openAddAccountDialog', handleOpenAddDialog);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/settings');
      setUserProfile(response.data);
      
      // Check if we need to show the profile setup prompt
      const needsProfileSetup = !response.data.email || !response.data.totp_enabled;
      if (needsProfileSetup) {
        setProfileSetupOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/accounts');
      const accountsData = response.data;
      setAccounts(accountsData);
      
      // Use the fresh data from response, not the stale state
      if (Object.keys(accountsData).length > 0) {
        setSelectedTab(0);
      } else {
        setSelectedTab(1);
      }
      setError('');
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setError('Failed to load accounts. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgingPasswords = async () => {
    try {
      const response = await api.get<AgingPassword[]>('/api/accounts/aging');
      setAgingPasswords(response.data);
    } catch (error) {
      console.error('Failed to fetch aging passwords:', error);
      setAgingPasswords([]);
    }
  };

  const handleEdit = (service: string) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleDelete = async (service: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await api.delete(`/api/accounts/${service}`);
        fetchAccounts();
        setClipboardMessage(`Account for ${service} has been deleted.`);
      } catch (error) {
        console.error('Error deleting account:', error);
        setError('Failed to delete account. Please try again.');
      }
    }
  };

  const copyToClipboard = async (username: string, password: string, service: string) => {
    try {
      await navigator.clipboard.writeText(`${username}\t${password}`);
      
      // Show success message
      setClipboardMessage(`Credentials for ${service} copied!`);
      setTimeout(() => setClipboardMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy credentials:', err);
      setClipboardMessage('Failed to copy credentials');
      setTimeout(() => setClipboardMessage(''), 3000);
    }
  };

  const openCredentialCard = (service: string, username: string, password: string) => {
    setSelectedCredential({ service, username, password });
    setCredentialCardOpen(true);
  };

  const calculateSecurityMetrics = (): SecurityMetrics | null => {
    const totalAccounts = Object.keys(accounts).length;
    if (totalAccounts === 0) return null;

    const metrics: SecurityMetrics = {
      passwordStrength: 0,
      passwordAge: 0,
      reusedPasswords: 0,
      twoFactorPercentage: 0,
      overallScore: 0
    };

    // Calculate average password strength
    metrics.passwordStrength = Math.round(
      Object.values(accounts).reduce((sum, acc) => sum + (acc.password_strength * 20), 0) / totalAccounts
    );

    // Calculate password age score
    const goodAgeCount = Object.values(accounts).filter(
      acc => {
        const lastChangedDate = new Date(acc.last_changed);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastChangedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 90;
      }
    ).length;
    metrics.passwordAge = Math.round((goodAgeCount / totalAccounts) * 100);

    // Calculate password reuse score
    const uniquePasswords = new Set(Object.values(accounts).map(acc => acc.password)).size;
    metrics.reusedPasswords = Math.round((uniquePasswords / totalAccounts) * 100);

    // Calculate 2FA usage
    const twoFACount = Object.values(accounts).filter(acc => acc.has_2fa).length;
    metrics.twoFactorPercentage = Math.round((twoFACount / totalAccounts) * 100);

    // Calculate overall score
    metrics.overallScore = Math.round(
      (metrics.passwordStrength + metrics.passwordAge + metrics.reusedPasswords + metrics.twoFactorPercentage) / 4
    );

    return metrics;
  };
  
  // Get data summary for dashboard cards
  const getDataSummary = () => {
    const totalAccounts = Object.keys(accounts).length;
    const weakPasswords = Object.values(accounts).filter(acc => acc.password_strength <= 2).length;
    const breachedPasswords = Object.values(accounts).filter(acc => acc.password_breach).length;
    const oldPasswords = agingPasswords.length;
    const accountsWith2FA = Object.values(accounts).filter(acc => acc.has_2fa).length;
    
    return {
      totalAccounts,
      weakPasswords,
      breachedPasswords,
      oldPasswords,
      accountsWith2FA,
      twoFactorRate: totalAccounts ? Math.round((accountsWith2FA / totalAccounts) * 100) : 0
    };
  };
  
  const summary = getDataSummary();
  const securityMetrics = calculateSecurityMetrics();
  
  // Profile menu handlers
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Generate initials from username
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleMenuItemClick = (action: string) => {
    handleMenuClose();
    
    if (action === 'logout') {
      onLogout();
    } else if (action === 'profile') {
      window.dispatchEvent(new CustomEvent('openProfilePage'));
    } else if (action === 'settings') {
      window.dispatchEvent(new CustomEvent('openSettingsPage'));
    }
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <SecurityIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Password Security
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Refresh data">
              <IconButton 
                color="inherit" 
                onClick={() => {
                  fetchAccounts();
                  fetchAgingPasswords();
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={username}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ 
                  width: 35, 
                  height: 35, 
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {getInitials(username)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { 
            minWidth: 200,
            borderRadius: 2,
            mt: 1
          },
        }}
      >
        <Box sx={{ py: 1, px: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">{username}</Typography>
          <Typography variant="body2" color="text.secondary">Personal Account</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleMenuItemClick('profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={onLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Security Dashboard
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Account
          </Button>
        </Box>
        
        {/* Dashboard Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Total Accounts
                </Typography>
                <Typography variant="h3" component="div" fontWeight="bold" color="primary">
                  {summary.totalAccounts}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Accounts managed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Security Score
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  fontWeight="bold"
                  color={
                    securityMetrics && securityMetrics.overallScore >= 80 ? 'success.main' :
                    securityMetrics && securityMetrics.overallScore >= 60 ? 'warning.main' : 'error.main'
                  }
                >
                  {securityMetrics ? `${securityMetrics.overallScore}%` : 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Overall security rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Accounts with 2FA
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  fontWeight="bold"
                  color={
                    summary.twoFactorRate >= 70 ? 'success.main' :
                    summary.twoFactorRate >= 40 ? 'warning.main' : 'error.main'
                  }
                >
                  {summary.twoFactorRate}%
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {summary.accountsWith2FA} of {summary.totalAccounts} accounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: summary.weakPasswords > 0 ? 'error.light' : 'success.light' }}>
              <CardContent>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Security Issues
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  fontWeight="bold"
                  color={summary.weakPasswords > 0 ? 'error.dark' : 'success.dark'}
                >
                  {summary.weakPasswords + summary.breachedPasswords + summary.oldPasswords}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Issues requiring attention
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Tab Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Security Dashboard" 
              iconPosition="start"
            />
            <Tab 
              icon={<ListIcon />} 
              label="Accounts" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box hidden={selectedTab !== 0} sx={{ mb: 4 }}>
          {/* Security Dashboard Tab */}
          {Object.keys(accounts).length > 0 && securityMetrics && (
            <SecurityScore 
              metrics={securityMetrics} 
              accounts={accounts}
            />
          )}

          {agingPasswords.length > 0 && (
            <Paper 
              sx={{ mb: 3, p: 3, borderLeft: '4px solid', borderColor: 'warning.main' }}
              role="alert"
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <WarningIcon color="warning" sx={{ mr: 2, fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Password Age Warning
                  </Typography>
                  <Typography variant="body1">
                    The following accounts have passwords that are over 90 days old. Consider updating them for better security.
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {agingPasswords.map(({ service, days_old }) => (
                  <Button
                    key={service}
                    variant="outlined"
                    size="small"
                    color="warning"
                    onClick={() => handleEdit(service)}
                    startIcon={<WarningIcon />}
                  >
                    {`${service} (${days_old} days)`}
                  </Button>
                ))}
              </Box>
            </Paper>
          )}
          
          {/* Empty state for security dashboard */}
          {Object.keys(accounts).length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No accounts added yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Add your first account to see your security score and recommendations.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add Your First Account
              </Button>
            </Paper>
          )}
        </Box>

        <Box hidden={selectedTab !== 1}>
          {/* Accounts Tab */}
          <CredentialList 
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCredentialCardOpen={openCredentialCard}
            onCopyToClipboard={copyToClipboard}
          />
        </Box>

        {/* Fixed Action Button for mobile */}
        {isMobile && (
          <Fab 
            color="primary" 
            aria-label="add account"
            onClick={() => setAddDialogOpen(true)}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Dialogs */}
        <AddCredential
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAccountAdded={fetchAccounts}
        />

        {selectedService && (
          <EditCredential
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            onAccountUpdated={fetchAccounts}
            service={selectedService}
            initialData={accounts[selectedService]}
          />
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={!!clipboardMessage}
          autoHideDuration={3000} 
          onClose={() => setClipboardMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" variant="filled">
            {clipboardMessage}
          </Alert>
        </Snackbar>

        {/* Credential Card */}
        {credentialCardOpen && selectedCredential && (
          <>
            <Backdrop
              sx={{ zIndex: 1200, bgcolor: 'rgba(0, 0, 0, 0.5)' }}
              open={credentialCardOpen}
              onClick={() => setCredentialCardOpen(false)}
            />
            <CredentialCard
              service={selectedCredential.service}
              username={selectedCredential.username}
              password={selectedCredential.password}
              onClose={() => setCredentialCardOpen(false)}
            />
          </>
        )}
      </Container>

      {/* Profile Setup Prompt */}
      <ProfileSetupPrompt 
        open={profileSetupOpen} 
        onClose={() => setProfileSetupOpen(false)}
        userId={userId}
      />
    </>
  );
}