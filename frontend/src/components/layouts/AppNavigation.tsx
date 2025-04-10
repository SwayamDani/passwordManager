// src/components/layouts/AppNavigation.tsx
import { useState, useEffect } from 'react';
import ProfilePage from '@/components/pages/ProfilePage';
import SettingsPage from '@/components/pages/SettingsPage';
import Dashboard from '@/components/layouts/Dashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

// This component manages navigation between different "pages" of the application
// without actually using the router, keeping everything as components

type Page = 'dashboard' | 'profile' | 'settings';

export default function AppNavigation({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Event listeners for navigation
    const handleDashboardPage = () => {
      setIsLoading(true);
      setCurrentPage('dashboard');
      setTimeout(() => setIsLoading(false), 300); // Short timeout for transition effect
    };
    
    const handleProfilePage = () => {
      setIsLoading(true);
      setCurrentPage('profile');
      setTimeout(() => setIsLoading(false), 300);
    };
    
    const handleSettingsPage = () => {
      setIsLoading(true);
      setCurrentPage('settings');
      setTimeout(() => setIsLoading(false), 300);
    };

    // Register event listeners
    window.addEventListener('openDashboardPage', handleDashboardPage);
    window.addEventListener('openProfilePage', handleProfilePage);
    window.addEventListener('openSettingsPage', handleSettingsPage);

    // Cleanup
    return () => {
      window.removeEventListener('openDashboardPage', handleDashboardPage);
      window.removeEventListener('openProfilePage', handleProfilePage);
      window.removeEventListener('openSettingsPage', handleSettingsPage);
    };
  }, []);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // Render the current page
  switch (currentPage) {
    case 'profile':
      return <ProfilePage />;
    case 'settings':
      return <SettingsPage />;
    case 'dashboard':
    default:
      return <Dashboard onLogout={onLogout} />;
  }
}