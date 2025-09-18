import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage = () => {
  return (
    <Container sx={{ py: 6 }} maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <Box mt={2}>
          <LoginForm />
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
