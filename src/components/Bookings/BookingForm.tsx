import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TextField, Button, Stack, Alert } from '@mui/material';

export type BookingFormValues = {
  start: Dayjs | null;
  end: Dayjs | null;
  description?: string;
};

export function BookingForm({
  initialValues,
  onSubmit,
  submitLabel = 'Create',
}: {
  initialValues?: Partial<BookingFormValues>;
  onSubmit: (values: { start: Date; end: Date; description?: string }) => Promise<void> | void;
  submitLabel?: string;
}) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<BookingFormValues>({
    defaultValues: {
      start: initialValues?.start ?? dayjs().minute(0).second(0),
      end: initialValues?.end ?? dayjs().add(1, 'hour').minute(0).second(0),
      description: initialValues?.description ?? '',
    },
  });

  const submit = async (v: BookingFormValues) => {
    if (!v.start || !v.end) {
      setError('root', { message: 'Start and End are required' });
      return;
    }
    await onSubmit({
      start: v.start.toDate(),
      end: v.end.toDate(),
      description: v.description,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2}>
          {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}

          <Controller
            name="start"
            control={control}
            render={({ field }) => (
              <DateTimePicker label="Start" value={field.value} onChange={field.onChange} />
            )}
          />

          <Controller
            name="end"
            control={control}
            render={({ field }) => (
              <DateTimePicker label="End" value={field.value} onChange={field.onChange} />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Description" fullWidth multiline minRows={2} />
            )}
          />

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </Stack>
      </form>
    </LocalizationProvider>
  );
}
