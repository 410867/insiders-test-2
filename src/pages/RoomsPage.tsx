import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Grid, Paper, Divider } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { Room, UserRoom, watchMyUserRooms, watchRoomsByIndex, createRoom } from '../firebase/firestore';
import { RoomForm } from '../components/Rooms/RoomForm';
import { RoomCard } from '../components/Rooms/RoomCard';

const RoomsPage = () => {
  const { user } = useAuth();
  const [userRooms, setUserRooms] = useState<UserRoom[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchMyUserRooms({ uid: user.uid, email: user.email ?? undefined }, setUserRooms);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!userRooms.length) { setRooms([]); return; }
    const unsub = watchRoomsByIndex(userRooms, setRooms);
    return () => unsub();
  }, [userRooms]);

  const roleByRoomId = useMemo(() => {
    const map: Record<string, 'admin' | 'user'> = {};
    userRooms.forEach(ur => map[ur.roomId] = ur.role);
    return map;
  }, [userRooms]);

  const handleCreate = async (v: { name: string; description?: string }) => {
    if (!user) return;
    await createRoom({ name: v.name, description: v.description, createdBy: user.uid, email: user.email ?? '' });
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Rooms</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Create a room</Typography>
        <RoomForm onSubmit={handleCreate} submitLabel="Create" />
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {rooms.map((r) => (
          <Grid item xs={12} md={6} lg={4} key={r.id}>
            <RoomCard room={r} myRole={roleByRoomId[r.id] || 'user'} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default RoomsPage;
