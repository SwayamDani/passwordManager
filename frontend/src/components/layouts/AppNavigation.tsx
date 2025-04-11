// src/components/layouts/AppNavigation.tsx
import { useState, useEffect } from 'react';
import ProfilePage from '@/components/pages/ProfilePage';
import SettingsPage from '@/components/pages/SettingsPage';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/components/pages/ResetPasswordPage';
import Dashboard from '@/components/layouts/Dashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

// This component manages navigation between different "pages" of the application

type Page = 'dashboard' | 'profile' | 'settings' | 'forgot-password' | 'reset-password' | 'login';

export default function AppNavigation({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

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

    const handleForgotPasswordPage = () => {
      console.log("Forgot password event triggered");
      setIsLoading(true);
      setCurrentPage('forgot-password');
      setTimeout(() => setIsLoading(false), 300);
    };

    const handleResetPasswordPage = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.token) {
        setResetToken(customEvent.detail.token);
      }
      setIsLoading(true);
      setCurrentPage('reset-password');
      setTimeout(() => setIsLoading(false), 300);
    };

    const handleLoginPage = () => {
      setIsLoading(true);
      setCurrentPage('login');
      onLogout();
      setTimeout(() => setIsLoading(false), 300);
    }

    // Register event listeners
    window.addEventListener('openDashboardPage', handleDashboardPage);
    window.addEventListener('openProfilePage', handleProfilePage);
    window.addEventListener('openSettingsPage', handleSettingsPage);
    window.addEventListener('openForgotPasswordPage', handleForgotPasswordPage);
    window.addEventListener('openResetPasswordPage', handleResetPasswordPage);
    window.addEventListener('openLoginPage', handleLoginPage);

    // Cleanup
    return () => {
      window.removeEventListener('openDashboardPage', handleDashboardPage);
      window.removeEventListener('openProfilePage', handleProfilePage);
      window.removeEventListener('openSettingsPage', handleSettingsPage);
      window.removeEventListener('openForgotPasswordPage', handleForgotPasswordPage);
      window.removeEventListener('openResetPasswordPage', handleResetPasswordPage);
      window.removeEventListener('openLoginPage', handleLoginPage);
    };
  }, [onLogout]);
  
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
    case 'forgot-password':
      return <ForgotPasswordPage />;
    case 'reset-password':
      return <ResetPasswordPage />;
    case 'dashboard':
    default:
      return <Dashboard onLogout={onLogout} />;
  }
}