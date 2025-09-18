import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export type RoomFormValues = { name: string; description?: string };

export function RoomForm({
  initialValues,
  onSubmit,
  submitLabel = 'Create',
}: {
  initialValues?: Partial<RoomFormValues>;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<RoomFormValues>({
    defaultValues: { name: '', description: '', ...(initialValues || {}) },
  });

  return (
    <form onSubmit={handleSubmit(async (v) => void (await onSubmit(v)))} noValidate>
      <Stack spacing={2}>
        <Controller
          name="name"
          control={control}
          rules={{ required: { value: true, message: 'Name is required' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Description" multiline minRows={2} fullWidth />
          )}
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
