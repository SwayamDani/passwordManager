import { Metadata } from 'next';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';

export const metadata: Metadata = {
  title: 'Forgot Password | Password Manager',
  description: 'Reset your password for your account',
};

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}