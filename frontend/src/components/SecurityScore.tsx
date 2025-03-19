import { Box, Paper, Typography, LinearProgress, Grid, Tooltip } from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import SecurityInsights from './SecurityInsights';

interface SecurityMetrics {
  overallScore: number;
  passwordStrength: number;
  passwordAge: number;
  reusedPasswords: number;
  twoFactorPercentage: number;
}

interface SecurityScoreProps {
  metrics: SecurityMetrics;
  accounts: Record<string, {
    username: string;
    password: string;
    password_strength: number;
    password_breach: boolean;
    has_2fa: boolean;
    last_changed: string;
  }>;
}

export default function SecurityScore({ metrics, accounts }: SecurityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <>
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Grid container spacing={3}>
          {/* Overall Score */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 48, color: getScoreColor(metrics.overallScore) }} />
              <Typography variant="h4" sx={{ mt: 1 }}>
                {metrics.overallScore}%
              </Typography>
              <Typography variant="subtitle1">Overall Security Score</Typography>
            </Box>
          </Grid>

          {/* Detailed Metrics */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {/* Password Strength */}
              <Grid item xs={12}>
                <Tooltip title="Average password strength across all accounts">
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <VpnKeyIcon sx={{ mr: 1 }} /> Password Strength
                      <Typography variant="body2" sx={{ ml: 'auto' }}>
                        {metrics.passwordStrength}%
                      </Typography>
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.passwordStrength} 
                      color={getScoreColor(metrics.passwordStrength)}
                    />
                  </Box>
                </Tooltip>
              </Grid>

              {/* Password Age */}
              <Grid item xs={12}>
                <Tooltip title="Percentage of passwords less than 90 days old">
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <HistoryIcon sx={{ mr: 1 }} /> Password Age
                      <Typography variant="body2" sx={{ ml: 'auto' }}>
                        {metrics.passwordAge}%
                      </Typography>
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.passwordAge} 
                      color={getScoreColor(metrics.passwordAge)}
                    />
                  </Box>
                </Tooltip>
              </Grid>

              {/* Reused Passwords */}
              <Grid item xs={12}>
                <Tooltip title="Percentage of unique passwords">
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <WarningIcon sx={{ mr: 1 }} /> Password Uniqueness
                      <Typography variant="body2" sx={{ ml: 'auto' }}>
                        {metrics.reusedPasswords}%
                      </Typography>
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.reusedPasswords} 
                      color={getScoreColor(metrics.reusedPasswords)}
                    />
                  </Box>
                </Tooltip>
              </Grid>

              {/* 2FA Usage */}
              <Grid item xs={12}>
                <Tooltip title="Percentage of accounts with 2FA enabled">
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SecurityIcon sx={{ mr: 1 }} /> 2FA Usage
                      <Typography variant="body2" sx={{ ml: 'auto' }}>
                        {metrics.twoFactorPercentage}%
                      </Typography>
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.twoFactorPercentage} 
                      color={getScoreColor(metrics.twoFactorPercentage)}
                    />
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      <SecurityInsights metrics={metrics} accounts={accounts} />
    </>
  );
}