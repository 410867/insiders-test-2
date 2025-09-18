import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import RegisterForm from '../components/Auth/RegisterForm';

const RegisterPage = () => {
  return (
    <Container sx={{ py: 6 }} maxWidth="sm">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Register</Typography>
        <Box mt={2}>
          <RegisterForm />
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
