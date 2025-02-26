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
} from '@mui/material';
import {
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AddAccount from './AddAccount';  // Add this import

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

export default function Dashboard({ onLogout }: DashboardProps) {
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/accounts');
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
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

      <List>
        {Object.entries(accounts).map(([service, account]) => (
          <Box key={service}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton edge="end" aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete">
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
                  <Box component="div" sx={{ mt: 1 }}>
                    <Typography component="span" variant="body2" display="block">
                      Username: {account.username}
                    </Typography>
                    <Box component="div" sx={{ display: 'flex', gap: 1, mt: 1 }}>
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