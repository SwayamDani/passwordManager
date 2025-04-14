export interface Account {
  username: string;
  password: string;
  password_strength: number;
  password_breach: boolean;
  password_reuse: string[];
  has_2fa: boolean;
  last_changed: string;
}

export interface AgingPassword {
  service: string;
  days_old: number;
}

export interface SecurityMetrics {
  overallScore: number;
  passwordStrength: number;
  passwordAge: number;
  reusedPasswords: number;
  twoFactorPercentage: number;
}