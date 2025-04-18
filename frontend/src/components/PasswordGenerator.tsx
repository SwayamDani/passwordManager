import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import axios from 'axios';

interface PasswordGeneratorProps {
  open: boolean;
  onClose: () => void;
  onSelectPassword: (password: string) => void;
}

export default function PasswordGenerator({ open, onClose, onSelectPassword }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [isBreached, setIsBreached] = useState(false);

  const generatePassword = async () => {
    try {
      const response = await axios.get(`/password/generate?length=${length}`);
      const password = response.data.password;
      setGeneratedPassword(password);
      
      const checkResponse = await axios.post('/password/check', { password });
      setStrength(checkResponse.data.strength_score);
      setIsBreached(checkResponse.data.is_breached);
    } catch (error) {
      console.error('Error generating password:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Password</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Password Length: {length}</Typography>
          <Slider
            value={length}
            onChange={(_, value) => setLength(value as number)}
            min={8}
            max={32}
            marks
            valueLabelDisplay="auto"
          />
          {generatedPassword && (
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Generated Password"
                value={generatedPassword}
                InputProps={{ readOnly: true }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip
                  label={`Strength: ${strength}/5`}
                  color={strength >= 4 ? 'success' : 'warning'}
                />
                {isBreached && (
                  <Chip
                    label="Found in data breach"
                    color="error"
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={generatePassword}>Generate</Button>
        {generatedPassword && (
          <Button 
            onClick={() => {
              onSelectPassword(generatedPassword);
              onClose();
            }}
            variant="contained"
          >
            Use Password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}