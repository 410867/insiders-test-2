import React, { useMemo, useState } from 'react';
import { Card, Typography, CardContent, CardActions, Button,
  Dialog, DialogTitle,  DialogContent,  DialogActions, TextField } from '@mui/material';
import { Room, updateRoom, deleteRoom } from '../../firebase/firestore';

export function RoomCard({ room, myRole }: { room: Room; myRole: 'admin' | 'user' }) {
  const isAdmin = myRole === 'admin';
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || '');

  const created = useMemo(() => {
    try { return room.createdAt?.toDate?.().toLocaleString() ?? ''; } catch { return ''; }
  }, [room.createdAt]);

  const onSave = async () => {
    await updateRoom(room.id, { name, description });
    setOpen(false);
  };

  const onDelete = async () => {
    if (confirm('Delete this room?')) {
      await deleteRoom(room.id);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{room.name}</Typography>
        {room.description && <Typography variant="body2" sx={{ mt: 1 }}>{room.description}</Typography>}
        {created && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Created: {created}</Typography>}
      </CardContent>
      <CardActions>
        {isAdmin && (
          <>
            <Button size="small" onClick={() => setOpen(true)}>Edit</Button>
            <Button size="small" color="error" onClick={onDelete}>Delete</Button>
          </>
        )}
        {/* здесь позже кнопка Manage members */}
      </CardActions>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit room</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
