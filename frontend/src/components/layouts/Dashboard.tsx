import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Tabs,
  Tab,
  Paper,
  Backdrop,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
} from '@mui/icons-material';
import api from '@/utils/axios';
import CredentialList from '@/components/features/credentials/CredentialList';
import SecurityScore from '@/components/features/security/SecurityScore';
import AddCredential from '@/components/features/credentials/AddCredential';
import EditCredential from '@/components/features/credentials/EditCredential';
import CredentialCard from '@/components/features/credentials/CredentialCard';
import { Account, AgingPassword, SecurityMetrics } from '@/types/account';

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

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
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

  useEffect(() => {
    fetchAccounts();
    fetchAgingPasswords();

    // Handle the custom event for opening add account dialog
    const handleOpenAddDialog = () => setAddDialogOpen(true);
    window.addEventListener('openAddAccountDialog', handleOpenAddDialog);

    return () => {
      window.removeEventListener('openAddAccountDialog', handleOpenAddDialog);
    };
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/accounts');
      const accountsData = response.data;
      setAccounts(accountsData);
      
      // Use the fresh data from response, not the stale state
      if (Object.keys(accountsData).length > 0) {
        setSelectedTab(0);
      } else {
        setSelectedTab(1);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
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
      } catch (error) {
        console.error('Error deleting account:', error);
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
            <Alert severity="warning" sx={{ mb: 1 }}>
              The following accounts have passwords that are over 90 days old. Consider updating them.
            </Alert>

            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {agingPasswords.map(({ service, days_old }) => (
                <Button
                  key={service}
                  variant="outlined"
                  size="small"
                  color="warning"
                  onClick={() => handleEdit(service)}
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
        <CredentialList 
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCredentialCardOpen={openCredentialCard}
          onCopyToClipboard={copyToClipboard}
        />
      </TabPanel>

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

      <Button
        variant="outlined"
        color="secondary"
        onClick={onLogout}
        sx={{ mt: 3 }}
      >
        Logout
      </Button>

      {clipboardMessage && (
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
      )}

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
    </Box>
  );
}