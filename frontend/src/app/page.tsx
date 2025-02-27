'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import { theme } from '@/theme';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Password Manager
            </Typography>
            {!isLoggedIn ? (
              <LoginForm onLogin={() => setIsLoggedIn(true)} />
            ) : (
              <Dashboard onLogout={() => setIsLoggedIn(false)} />
            )}
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}