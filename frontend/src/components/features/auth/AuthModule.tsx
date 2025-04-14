"use client"

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Box, Tabs, Tab } from '@mui/material';

interface AuthModuleProps {
  onLogin: (token: string, username: string) => void;
}

export default function AuthModule({ onLogin }: AuthModuleProps) {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>
      
      {tab === 0 ? (
        <LoginForm onLogin={onLogin} />
      ) : (
        <RegisterForm onSuccess={() => setTab(0)} />
      )}
    </Box>
  );
}