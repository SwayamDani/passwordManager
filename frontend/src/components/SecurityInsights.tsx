import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface SecurityInsight {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

interface SecurityInsightsProps {
  metrics: {
    passwordStrength: number;
    passwordAge: number;
    reusedPasswords: number;
    twoFactorPercentage: number;
  };
  accounts: Record<string, any>;
}

export default function SecurityInsights({ metrics, accounts }: SecurityInsightsProps) {
  const generateInsights = (): SecurityInsight[] => {
    const insights: SecurityInsight[] = [];
    const totalAccounts = Object.keys(accounts).length;

    // Password Strength Insights
    if (metrics.passwordStrength >= 80) {
      insights.push({
        type: 'success',
        title: 'Strong Password Security',
        description: 'Most of your passwords have excellent strength. Keep up the good work!'
      });
    } else if (metrics.passwordStrength < 60) {
      insights.push({
        type: 'error',
        title: 'Weak Password Security',
        description: 'Many of your passwords could be stronger. Consider updating them using the password generator.'
      });
    }

    // Password Age Insights
    if (metrics.passwordAge < 70) {
      insights.push({
        type: 'warning',
        title: 'Password Age Issues',
        description: `${100 - metrics.passwordAge}% of your passwords are over 90 days old. Regular updates are recommended.`
      });
    }

    // Password Reuse Insights
    if (metrics.reusedPasswords < 100) {
      insights.push({
        type: 'error',
        title: 'Password Reuse Detected',
        description: 'Some of your passwords are being reused across accounts. This is a security risk.'
      });
    }

    // 2FA Adoption Insights
    if (metrics.twoFactorPercentage < 50) {
      insights.push({
        type: 'warning',
        title: 'Low 2FA Adoption',
        description: 'Enable two-factor authentication on more accounts to improve security.'
      });
    }

    // Account Distribution
    if (totalAccounts < 5) {
      insights.push({
        type: 'info',
        title: 'Account Coverage',
        description: 'Consider adding more accounts to the password manager for better security coverage.'
      });
    }

    return insights;
  };

  const getInsightIcon = (type: SecurityInsight['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const insights = generateInsights();

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" component="div">
          Security Insights ({insights.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {insights.map((insight, index) => (
            <ListItem key={index} sx={{ mb: 1 }}>
              <ListItemIcon>
                {getInsightIcon(insight.type)}
              </ListItemIcon>
              <ListItemText
                primary={insight.title}
                secondary={insight.description}
                primaryTypographyProps={{
                  fontWeight: 'medium'
                }}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}