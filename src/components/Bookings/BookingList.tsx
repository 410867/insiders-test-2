import React from 'react';
import { List, ListItem, ListItemText, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { Booking } from '../../firebase/firestore';

export function BookingList({
  bookings,
  canEdit,
  onEdit,
  onDelete,
}: {
  bookings: Booking[];
  canEdit: boolean;
  onEdit: (b: Booking) => void;
  onDelete: (b: Booking) => void;
}) {
  return (
    <List>
      {bookings.map(b => (
        <ListItem key={b.id}
          secondaryAction={canEdit && (
            <>
              <IconButton edge="end" aria-label="edit" onClick={() => onEdit(b)}><EditIcon /></IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => onDelete(b)}><DeleteIcon /></IconButton>
            </>
          )}
        >
          <ListItemText
            primary={`${dayjs(b.start.toDate()).format('YYYY-MM-DD HH:mm')} → ${dayjs(b.end.toDate()).format('YYYY-MM-DD HH:mm')}`}
            secondary={b.description}
          />
        </ListItem>
      ))}
    </List>
  );
}
