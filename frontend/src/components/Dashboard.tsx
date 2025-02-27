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
} from '@mui/material';
import {
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AddAccount from './AddAccount';  // Add this import
import EditAccount from './EditAccount';

interface DashboardProps {
  onLogout: () => void;
}

interface Account {
  username: string;
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

export default function Dashboard({ onLogout }: DashboardProps) {
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [agingPasswords, setAgingPasswords] = useState<AgingPassword[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchAgingPasswords();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/accounts');
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchAgingPasswords = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/accounts/aging');
      setAgingPasswords(response.data.aging_passwords);
    } catch (error) {
      console.error('Error fetching aging passwords:', error);
    }
  };

  const handleEdit = (service: string) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleDelete = async (service: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await axios.delete(`http://localhost:8000/api/accounts/${service}`);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const getPasswordAge = (lastChanged: string): number => {
    const lastChangedDate = new Date(lastChanged);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastChangedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Box>
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

      {agingPasswords.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ color: '#ed6c02', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon /> Password Update Needed
          </Typography>
          <Typography variant="body2">
            The following accounts have passwords that are over 90 days old:
          </Typography>
          <Box sx={{ mt: 1 }}>
            {agingPasswords.map(({ service, days_old }) => (
              <Chip
                key={service}
                label={`${service} (${days_old} days)`}
                size="small"
                color="warning"
                sx={{ mr: 1, mt: 1 }}
                onClick={() => handleEdit(service)}
              />
            ))}
          </Box>
        </Box>
      )}

      <List>
        {Object.entries(accounts).map(([service, account]) => (
          <Box key={service}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton 
                    edge="end" 
                    aria-label="edit"
                    onClick={() => handleEdit(service)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDelete(service)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
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
                    <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={`Strength: ${account.password_strength}/5`}
                        color={account.password_strength >= 4 ? 'success' : 'warning'}
                      />
                      {account.has_2fa && (
                        <Chip
                          size="small"
                          icon={<SecurityIcon />}
                          label="2FA Enabled"
                          color="success"
                        />
                      )}
                      {account.password_breach && (
                        <Chip
                          size="small"
                          label="Compromised"
                          color="error"
                        />
                      )}
                      {getPasswordAge(account.last_changed) >= 90 && (
                        <Chip
                          size="small"
                          icon={<WarningIcon />}
                          label={`${getPasswordAge(account.last_changed)} days old`}
                          color="warning"
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