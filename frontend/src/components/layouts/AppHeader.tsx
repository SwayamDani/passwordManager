// src/components/layouts/AppHeader.tsx
import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  ExitToApp as ExitToAppIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

interface AppHeaderProps {
  username: string;
  onLogout: () => void;
  onToggleDrawer?: () => void;
  showMenuIcon?: boolean;
}

export default function AppHeader({ 
  username, 
  onLogout, 
  onToggleDrawer,
  showMenuIcon = true,
}: AppHeaderProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action: string) => {
    handleClose();
    
    if (action === 'logout') {
      onLogout();
    } else if (action === 'profile') {
      window.dispatchEvent(new CustomEvent('openProfilePage'));
    } else if (action === 'settings') {
      window.dispatchEvent(new CustomEvent('openSettingsPage'));
    } else if (action === 'dashboard') {
      window.dispatchEvent(new CustomEvent('openDashboardPage'));
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {showMenuIcon && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={onToggleDrawer}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => handleMenuItemClick('dashboard')}>
          <SecurityIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Password Security
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box display="flex" alignItems="center">
          <Button 
            color="inherit" 
            onClick={() => handleMenuItemClick('dashboard')}
            sx={{ mr: 1 }}
            startIcon={<DashboardIcon />}
          >
            Dashboard
          </Button>
          
          <IconButton
            onClick={handleClick}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{ ml: 1 }}
          >
            <Avatar 
              sx={{ 
                width: 35, 
                height: 35, 
                bgcolor: theme.palette.primary.main,
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {getInitials(username)}
            </Avatar>
          </IconButton>
        </Box>
        
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 200,
              borderRadius: 2,
              mt: 1,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personal Account
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={() => handleMenuItemClick('profile')}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Profile
            </ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleMenuItemClick('settings')}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Settings
            </ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={() => handleMenuItemClick('logout')}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ color: 'error' }}>
              Logout
            </ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}