import React from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Button, Stack, Alert } from '@mui/material';
import { registerWithEmail } from '../../firebase/auth';
import { useNavigate } from 'react-router-dom';

type FormValues = { name: string; email: string; password: string };

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerWithEmail(values.name, values.email, values.password);
      navigate('/');
    } catch (e: any) {
      setError('root', { message: e?.message || 'Registration failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}
        <TextField
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={!!errors.name}
          helperText={errors.name?.message}
          fullWidth
        />
        <TextField
          label="Email"
          type="email"
          {...register('email', { required: 'Email is required' })}
          error={!!errors.email}
          helperText={errors.email?.message}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
          error={!!errors.password}
          helperText={errors.password?.message}
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>Sign Up</Button>
      </Stack>
    </form>
  );
};

export default RegisterForm;
