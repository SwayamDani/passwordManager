// src/components/layouts/Navbar.tsx
import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LockOutlined as LockIcon,
  Settings as SettingsIcon,
  BarChart as AnalyticsIcon,
  Shield as ShieldIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  username: string;
  onLogout: () => void;
}

export default function Navbar({ username, onLogout }: NavbarProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const navigateTo = (path: string) => {
    router.push(path);
    handleMenuClose();
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  // Generate initials from username
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: { 
          minWidth: 200,
          borderRadius: 2,
          mt: 1.5 
        },
      }}
    >
      <Box sx={{ py: 1, px: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">{username}</Typography>
        <Typography variant="body2" color="text.secondary">Personal Account</Typography>
      </Box>
      <Divider />
      <MenuItem onClick={() => navigateTo('/settings')}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
      </MenuItem>
    </Menu>
  );

  const mobileMenuId = 'mobile-menu';
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      id={mobileMenuId}
      keepMounted
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <MenuItem onClick={() => navigateTo('/settings')}>
        <IconButton color="inherit" size="small">
          <SettingsIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>Settings</Typography>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton color="inherit" size="small">
          <PersonIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>Profile</Typography>
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <IconButton color="error" size="small">
          <LogoutIcon />
        </IconButton>
        <Typography variant="subtitle2" color="error" sx={{ ml: 1 }}>Logout</Typography>
      </MenuItem>
    </Menu>
  );

  const drawerWidth = 240;
  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          PassGuard
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigateTo('/')}>
            <ListItemIcon>
              <DashboardIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => window.dispatchEvent(new CustomEvent('openAddAccountDialog'))}>
            <ListItemIcon>
              <LockIcon color="secondary" />
            </ListItemIcon>
            <ListItemText primary="Add Account" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigateTo('/')}>
            <ListItemIcon>
              <AnalyticsIcon color="info" />
            </ListItemIcon>
            <ListItemText primary="Security Score" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigateTo('/settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" elevation={1} color="default" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: 'white' }}>
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShieldIcon color="primary" sx={{ fontSize: 28, mr: 1, display: { xs: 'none', md: 'flex' } }} />
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  fontWeight: 'bold',
                }}
              >
                PassGuard
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'center' }}>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ fontWeight: 'bold' }}
              >
                PassGuard
              </Typography>
            </Box>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 4, flexGrow: 1 }}>
              <Button 
                color="inherit" 
                startIcon={<DashboardIcon />}
                onClick={() => navigateTo('/')}
                sx={{ mx: 1 }}
              >
                Dashboard
              </Button>
              <Button 
                color="inherit"
                startIcon={<LockIcon />}
                onClick={() => window.dispatchEvent(new CustomEvent('openAddAccountDialog'))}
                sx={{ mx: 1 }}
              >
                Add Account
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex' }}>
              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Tooltip title="Notifications">
                  <IconButton color="inherit">
                    <NotificationsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Tooltip title={username}>
                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
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
              </Tooltip>
              
              <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  aria-label="show more"
                  aria-controls={mobileMenuId}
                  aria-haspopup="true"
                  onClick={handleMobileMenuOpen}
                  color="inherit"
                >
                  <MoreIcon />
                </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: 'none',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {renderMobileMenu}
      {renderMenu}
      
      {/* Add a toolbar for spacing */}
      <Toolbar />
    </>
  );
}