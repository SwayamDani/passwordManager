import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Chip,
  Stack,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
} from '@mui/icons-material';
import api from '../utils/axios';
import AddAccount from './AddAccount';
import EditAccount from './EditAccount';
import SecurityScore from './SecurityScore';

interface DashboardProps {
  onLogout: () => void;
}

interface Account {
  username: string;
  password: string;
  password_strength: number;
  password_breach: boolean;
  password_reuse: string[];
  has_2fa: boolean;
  last_changed: string;
}

interface AgingPassword {
  service: string;
  days_old: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [agingPasswords, setAgingPasswords] = useState<AgingPassword[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchAccounts();
    fetchAgingPasswords();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);

      const agingResponse = await api.get('/accounts/aging');
      setAgingPasswords(agingResponse.data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchAgingPasswords = async () => {
    try {
      const response = await api.get<AgingPassword[]>('/accounts/aging');
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
        await api.delete(`/accounts/${service}`);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const togglePasswordVisibility = (service: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const getPasswordAge = (lastChanged: string): number => {
    const lastChangedDate = new Date(lastChanged);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastChangedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a snackbar notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const calculateSecurityMetrics = () => {
    const totalAccounts = Object.keys(accounts).length;
    if (totalAccounts === 0) return null;

    const metrics = {
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
      acc => getPasswordAge(acc.last_changed) < 90
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

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
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

      <TabPanel value={selectedTab} index={0}>
        {/* Security Dashboard Tab */}
        {Object.keys(accounts).length > 0 && (
          <SecurityScore 
            metrics={calculateSecurityMetrics() || {
              overallScore: 0,
              passwordStrength: 0,
              passwordAge: 0,
              reusedPasswords: 0,
              twoFactorPercentage: 0
            }} 
            accounts={accounts}
          />
        )}

        {agingPasswords.length > 0 && (
          <Box 
            sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}
            role="alert"
          >
            <Typography 
              variant="h6" 
              sx={{ color: '#ed6c02', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <WarningIcon aria-hidden="true" /> 
              Password Update Needed
            </Typography>
            <Typography variant="body2">
              The following accounts have passwords that are over 90 days old:
            </Typography>
            <Box sx={{ mt: 1 }}>
              {agingPasswords.map(({ service, days_old }) => (
                <Button
                  key={service}
                  variant="outlined"
                  size="small"
                  color="warning"
                  onClick={() => handleEdit(service)}
                  sx={{ mr: 1, mt: 1 }}
                  startIcon={<WarningIcon />}
                >
                  {`${service} (${days_old} days)`}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {/* Accounts Tab */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Your Accounts</Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setAddDialogOpen(true)}
          >
            Add Account
          </Button>
        </Box>

        <List>
          {Object.entries(accounts).map(([service, account]) => (
            <Box key={service}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton 
                      edge="end" 
                      aria-label="Copy password"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(account.password);
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label={`Edit ${service} account`}
                      onClick={() => handleEdit(service)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label={`Delete ${service} account`}
                      onClick={() => handleDelete(service)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockIcon />
                      <Typography variant="h6" component="span">{service}</Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      <Typography 
                        component="span"
                        variant="body2" 
                        sx={{ display: 'block', mb: 1 }}
                      >
                        Username: {account.username}
                      </Typography>
                      <Typography 
                        component="span"
                        variant="body2" 
                        sx={{ display: 'block', mb: 1 }}
                      >
                        Password: {visiblePasswords[service] ? account.password : '••••••••'}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePasswordVisibility(service);
                          }}
                          sx={{ ml: 1 }}
                          aria-label={visiblePasswords[service] ? "Hide password" : "Show password"}
                        >
                          {visiblePasswords[service] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Typography>
                      <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={`Password strength: ${account.password_strength || 0} out of 5`}
                          color={account.password_strength >= 4 ? 'success' : 'warning'}
                          role="status"
                        />
                        {account.has_2fa && (
                          <Chip
                            size="small"
                            icon={<SecurityIcon aria-hidden="true" />}
                            label="Two-factor authentication enabled"
                            color="success"
                            role="status"
                          />
                        )}
                        {account.password_breach && (
                          <Chip
                            size="small"
                            label="Password compromised - needs update"
                            color="error"
                            role="alert"
                          />
                        )}
                        {getPasswordAge(account.last_changed) >= 90 && (
                          <Chip
                            size="small"
                            icon={<WarningIcon aria-hidden="true" />}
                            label={`Password is ${getPasswordAge(account.last_changed)} days old - update recommended`}
                            color="warning"
                            role="alert"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </Box>
          ))}
        </List>
      </TabPanel>

      <AddAccount
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAccountAdded={fetchAccounts}
      />

      {selectedService && (
        <EditAccount
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onAccountUpdated={fetchAccounts}
          service={selectedService}
          initialData={accounts[selectedService]}
        />
      )}

      <Button
        variant="outlined"
        color="secondary"
        onClick={onLogout}
        sx={{ mt: 3 }}
      >
        Logout
      </Button>
    </Box>
  );
}