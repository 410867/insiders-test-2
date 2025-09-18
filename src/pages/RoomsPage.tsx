import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Divider } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import {
  Room,
  watchRoomsForUser,
  watchRoomMembers,
  createRoom,
  RoomMember,
} from '../firebase/firestore';
import { RoomForm } from '../components/Rooms/RoomForm';
import { RoomCard } from '../components/Rooms/RoomCard';

const RoomsPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, 'admin' | 'user'>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = watchRoomsForUser(
      { uid: user.uid, email: user.email ?? undefined },
      setRooms,
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubs: Array<() => void> = [];
    rooms.forEach((r) => {
      const unsub = watchRoomMembers(r.id, (members: RoomMember[]) => {
        const me = members.find(
          (m) => m.userId === user.uid || (!!user.email && m.email === user.email),
        );
        setRolesMap((prev) => ({ ...prev, [r.id]: (me?.role ?? 'user') }));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [rooms, user]);

  const handleCreate = async (values: { name: string; description?: string }) => {
    if (!user) return;
    await createRoom({
      name: values.name,
      description: values.description,
      createdBy: user.uid,
    });
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Rooms
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create a room
        </Typography>
        <RoomForm onSubmit={handleCreate} submitLabel="Create" />
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {rooms.map((room) => (
          <Grid item xs={12} md={6} lg={4} key={room.id}>
            <RoomCard room={room} myRole={rolesMap[room.id] || 'user'} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default RoomsPage;
