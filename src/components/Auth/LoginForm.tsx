import React from 'react';
import { useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { loginWithEmail } from '../../firebase/auth';
import { useNavigate } from 'react-router-dom';

type FormValues = { email: string; password: string };

const LoginForm = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await loginWithEmail(values.email, values.password);
      navigate('/');
    } catch (e: any) {
      setError('root', { message: e?.message || 'Login failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}
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
        <Button type="submit" variant="contained" disabled={isSubmitting}>Sign In</Button>
      </Stack>
    </form>
  );
};

export default LoginForm;
