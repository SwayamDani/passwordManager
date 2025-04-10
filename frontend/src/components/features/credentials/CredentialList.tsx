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
  Button
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

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Your Accounts</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.dispatchEvent(new CustomEvent('openAddAccountDialog'))}
        >
          Add Account
        </Button>
      </Box>

      <List>
        {Object.entries(accounts).map(([service, account]) => (
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
                    <LockIcon />
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
                            togglePasswordVisibility(service);
                          }}
                          sx={{ ml: 1 }}
                          aria-label={visiblePasswords[service] ? "Hide password" : "Show password"}
                        >
                          {visiblePasswords[service] ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
        ))}
      </List>
    </>
  );
}