import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export type MemberRole = 'admin' | 'user';

export type Room = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: any;
};

export type RoomMember = {
  id: string;
  userId?: string | null;
  email: string;
  role: MemberRole;
  addedAt: any;
};

export type Booking = {
  id: string;
  start: any;
  end: any;
  description?: string;
  createdBy: string;
  createdAt: any;
};

export async function createRoom(params: {
  name: string;
  description?: string;
  createdBy: string;
}) {
  const ref = await addDoc(collection(db, 'rooms'), {
    name: params.name,
    description: params.description ?? '',
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });

  await addMember(ref.id, {
    userId: params.createdBy,
    email: '',
    role: 'admin',
  });

  return ref.id;
}

export async function updateRoom(
  roomId: string,
  patch: Partial<Pick<Room, 'name' | 'description'>>,
) {
  const r = doc(db, 'rooms', roomId);
  await updateDoc(r, patch as any);
}

export async function deleteRoom(roomId: string) {
  const membersRef = collection(db, 'rooms', roomId, 'members');
  const snap = await getDocs(membersRef);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const d = await getDoc(doc(db, 'rooms', roomId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as any) } as Room;
}

export async function addMember(
  roomId: string,
  m: { userId?: string | null; email: string; role: MemberRole },
) {
  const ref = collection(db, 'rooms', roomId, 'members');
  await addDoc(ref, {
    userId: m.userId ?? null,
    email: m.email,
    role: m.role,
    addedAt: serverTimestamp(),
  });
}

export async function updateMemberRole(roomId: string, memberId: string, role: MemberRole) {
  await setDoc(doc(db, 'rooms', roomId, 'members', memberId), { role }, { merge: true });
}

export async function removeMember(roomId: string, memberId: string) {
  await deleteDoc(doc(db, 'rooms', roomId, 'members', memberId));
}

export function watchRoomMembers(
  roomId: string,
  cb: (members: RoomMember[]) => void,
): Unsubscribe {
  const ref = collection(db, 'rooms', roomId, 'members');
  return onSnapshot(ref, (snap) => {
    const list: RoomMember[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(list);
  });
}

export function watchRoomsForUser(
  params: { uid?: string; email?: string },
  cb: (rooms: Room[]) => void,
): Unsubscribe {
  const roomUnsubs = new Map<string, Unsubscribe>();
  const memberUnsubs: Unsubscribe[] = [];
  const roomsMap = new Map<string, Room>();

  const emit = () =>
    cb(Array.from(roomsMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '')));

  const ensureRoomListener = (roomId: string) => {
    if (roomUnsubs.has(roomId)) return;

    const u = onSnapshot(doc(db, 'rooms', roomId), (d) => {
      if (d.exists()) {
        roomsMap.set(roomId, { id: roomId, ...(d.data() as any) } as Room);
      } else {
        roomsMap.delete(roomId);
      }
      emit();
    });
    roomUnsubs.set(roomId, u);
  };

  if (params.uid) {
    const q1 = query(collectionGroup(db, 'members'), where('userId', '==', params.uid));
    const u1 = onSnapshot(q1, (snap) => {
      snap.docChanges().forEach((ch) => {
        const roomRef = ch.doc.ref.parent.parent;
        const roomId = roomRef?.id;
        if (!roomId) return;
        if (ch.type === 'added' || ch.type === 'modified') ensureRoomListener(roomId);
        if (ch.type === 'removed') {}
      });
    });
    memberUnsubs.push(u1);
  }

  if (params.email) {
    const q2 = query(collectionGroup(db, 'members'), where('email', '==', params.email));
    const u2 = onSnapshot(q2, (snap) => {
      snap.docChanges().forEach((ch) => {
        const roomRef = ch.doc.ref.parent.parent;
        const roomId = roomRef?.id;
        if (!roomId) return;
        if (ch.type === 'added' || ch.type === 'modified') ensureRoomListener(roomId);
      });
    });
    memberUnsubs.push(u2);
  }

  return () => {
    memberUnsubs.forEach((u) => u());
    roomUnsubs.forEach((u) => u());
  };
}

function toTimestamp(date: Date) {
  return Timestamp.fromDate(date);
}

export async function hasBookingConflict(
  roomId: string,
  start: Date,
  end: Date,
  excludeId?: string,
) {
  const q1 = query(
    collection(db, 'rooms', roomId, 'bookings'),
    where('start', '<', toTimestamp(end)),
  );
  const snap = await getDocs(q1);

  return snap.docs.some((d) => {
    if (excludeId && d.id === excludeId) return false;
    const data = d.data() as any;
    const bEnd: Date | undefined = data.end?.toDate?.();
    if (!bEnd) return false;
    return bEnd > start;
  });
}

export async function createBooking(
  roomId: string,
  params: { start: Date; end: Date; description?: string; createdBy: string },
) {
  if (params.end <= params.start) throw new Error('End must be after start');

  const conflict = await hasBookingConflict(roomId, params.start, params.end);
  if (conflict) throw new Error('Time conflict: overlapping booking');

  const ref = await addDoc(collection(db, 'rooms', roomId, 'bookings'), {
    start: toTimestamp(params.start),
    end: toTimestamp(params.end),
    description: params.description ?? '',
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBooking(
  roomId: string,
  bookingId: string,
  patch: { start?: Date; end?: Date; description?: string },
) {
  const ref = doc(db, 'rooms', roomId, 'bookings', bookingId);
  const cur = await getDoc(ref);
  if (!cur.exists()) throw new Error('Booking not found');

  const data = cur.data() as any;
  const newStart = patch.start ?? data.start.toDate();
  const newEnd = patch.end ?? data.end.toDate();
  if (newEnd <= newStart) throw new Error('End must be after start');

  const conflict = await hasBookingConflict(roomId, newStart, newEnd, bookingId);
  if (conflict) throw new Error('Time conflict: overlapping booking');

  await updateDoc(ref, {
    ...(patch.start ? { start: toTimestamp(patch.start) } : {}),
    ...(patch.end ? { end: toTimestamp(patch.end) } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
  } as any);
}

export async function deleteBooking(roomId: string, bookingId: string) {
  await deleteDoc(doc(db, 'rooms', roomId, 'bookings', bookingId));
}

export function watchBookings(roomId: string, cb: (list: Booking[]) => void) {
  const ref = collection(db, 'rooms', roomId, 'bookings');
  const q = query(ref);
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort(
        (a, b) =>
          (a.start?.toMillis?.() ?? 0) - (b.start?.toMillis?.() ?? 0),
      );
    cb(list as Booking[]);
  });
}
