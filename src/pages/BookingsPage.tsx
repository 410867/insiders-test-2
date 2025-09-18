import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, MenuItem, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import {
  Room,
  watchRoomsForUser,
  watchBookings,
  Booking,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../firebase/firestore';
import { BookingForm } from '../components/Bookings/BookingForm';
import { BookingList } from '../components/Bookings/BookingList';

const BookingsPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [edit, setEdit] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = watchRoomsForUser({ uid: user.uid, email: user.email ?? undefined }, setRooms);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = watchBookings(roomId, setBookings);
    return () => unsub();
  }, [roomId]);

  const handleCreate = async (v: { start: Date; end: Date; description?: string }) => {
    if (!user || !roomId) return;
    await createBooking(roomId, { ...v, createdBy: user.uid });
  };

  const handleUpdate = async (v: { start: Date; end: Date; description?: string }) => {
    if (!edit || !roomId) return;
    await updateBooking(roomId, edit.id, v);
    setEdit(null);
  };

  const handleDelete = async (b: Booking) => {
    if (!roomId) return;
    if (confirm('Delete this booking?')) await deleteBooking(roomId, b.id);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bookings
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          select
          label="Room"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          fullWidth
        >
          {rooms.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {roomId && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Create booking
              </Typography>
              <BookingForm onSubmit={handleCreate} submitLabel="Create" />
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Existing bookings
              </Typography>
              <BookingList bookings={bookings} canEdit={true} onEdit={setEdit} onDelete={handleDelete} />
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit booking</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {edit && (
            <BookingForm
              initialValues={{
                start: dayjs(edit.start.toDate()),
                end: dayjs(edit.end.toDate()),
                description: edit.description,
              }}
              onSubmit={handleUpdate}
              submitLabel="Save"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingsPage;
