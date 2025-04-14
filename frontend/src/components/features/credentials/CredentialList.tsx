// src/components/features/credentials/CredentialList.tsx
import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Typography,
  Chip,
  Stack,
  Button,
  TextField,
  InputAdornment,
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
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Account } from '@/types/account';

interface CredentialListProps {
  accounts: Record<string, Account>;
  onEdit: (service: string) => void;
  onDelete: (service: string) => void;
  onCredentialCardOpen: (service: string, username: string, password: string) => void;
  onCopyToClipboard: (username: string, password: string, service: string) => void;
}

export default function CredentialList({
  accounts,
  onEdit,
  onDelete,
  onCredentialCardOpen,
  onCopyToClipboard
}: CredentialListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const togglePasswordVisibility = (service: string, event: React.MouseEvent) => {
    event.stopPropagation();
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

  // Filter accounts by search query
  const filteredServices = Object.keys(accounts).filter(service => 
    service.toLowerCase().includes(searchQuery.toLowerCase()) || 
    accounts[service].username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Your Accounts</Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => window.dispatchEvent(new CustomEvent('openAddAccountDialog'))}
        >
          Add Account
        </Button>
      </Box>

      {/* Search bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {filteredServices.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            {searchQuery ? 'No matching accounts found' : 'No accounts found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchQuery ? 'Try a different search term' : 'Start by adding your first account'}
          </Typography>
          {!searchQuery && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => window.dispatchEvent(new CustomEvent('openAddAccountDialog'))}
            >
              Add Your First Account
            </Button>
          )}
        </Box>
      ) : (
        <Paper>
          <List>
            {filteredServices.map(service => {
              const account = accounts[service];
              return (
                <Box key={service}>
                  <ListItem
                    onClick={() => onCredentialCardOpen(service, account.username, account.password)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton 
                          edge="end" 
                          aria-label="Copy credentials"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening the credential card
                            onCopyToClipboard(account.username, account.password, service);
                          }}
                          title="Copy username & password"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label={`Edit ${service} account`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening the credential card
                            onEdit(service);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label={`Delete ${service} account`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening the credential card
                            onDelete(service);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LockIcon color="primary" />
                          <Typography variant="h6" component="span">{service}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'block' }}>
                          <Box sx={{ display: 'block', mb: 1 }}>
                            <Typography 
                              component="span"
                              variant="body2" 
                            >
                              Username: {account.username}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'block', mb: 1 }}>
                            <Typography 
                              component="span"
                              variant="body2" 
                            >
                              Password: {visiblePasswords[service] ? account.password : '••••••••'}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePasswordVisibility(service, e);
                                }}
                                sx={{ ml: 1 }}
                                aria-label={visiblePasswords[service] ? "Hide password" : "Show password"}
                              >
                                {visiblePasswords[service] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
              );
            })}
          </List>
        </Paper>
      )}
    </>
  );
}