import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  collectionGroup,
} from 'firebase/firestore';
import { db } from './config';
import { setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export type MemberRole = 'admin' | 'user';
export type Room = { id: string; name: string; description?: string; createdBy: string; createdAt: any };
export type UserRoom = { id: string; userId?: string | null; email: string; roomId: string; role: MemberRole; addedAt: any };

export async function createRoom(params: { name: string; description?: string; createdBy: string; email?: string }) {
  const r = await addDoc(collection(db, 'rooms'), {
    name: params.name,
    description: params.description ?? '',
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });
  await addUserRoom({ userId: params.createdBy, email: params.email ?? '', roomId: r.id, role: 'admin' });
  return r.id;
}

export async function updateRoom(roomId: string, patch: Partial<Pick<Room,'name'|'description'>>) {
  await updateDoc(doc(db, 'rooms', roomId), patch as any);
}

export async function deleteRoom(roomId: string) {
  const qIdx = query(collection(db, 'userRooms'), where('roomId', '==', roomId));
  const snap = await getDocs(qIdx);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const d = await getDoc(doc(db, 'rooms', roomId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as any) } as Room;
}

export async function addUserRoom(m: { userId?: string | null; email: string; roomId: string; role: MemberRole }) {
  await addDoc(collection(db, 'userRooms'), {
    userId: m.userId ?? null,
    email: m.email,
    roomId: m.roomId,
    role: m.role,
    addedAt: serverTimestamp(),
  });
}

export async function removeUserRoom(userRoomId: string) {
  await deleteDoc(doc(db, 'userRooms', userRoomId));
}

export async function updateUserRoomRole(userRoomId: string, role: MemberRole) {
  await setDoc(doc(db, 'userRooms', userRoomId), { role }, { merge: true });
}

export function watchMyUserRooms(params: { uid?: string; email?: string }, cb: (list: UserRoom[]) => void) {
  const unsubs: Array<() => void> = [];
  const emit = (docs: any[]) => cb(docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UserRoom[]);

  if (params.uid) {
    const q1 = query(collection(db, 'userRooms'), where('userId', '==', params.uid));
    unsubs.push(onSnapshot(q1, (snap) => emit(snap.docs)));
  }
  if (params.email) {
    const q2 = query(collection(db, 'userRooms'), where('email', '==', params.email));
    unsubs.push(onSnapshot(q2, (snap) => emit(snap.docs)));
  }
  return () => unsubs.forEach(u => u());
}

export function watchRoomsByIndex(userRooms: UserRoom[], cb: (rooms: Room[]) => void) {
  const unsubs: Array<() => void> = [];
  const map = new Map<string, Room>();
  const ids = Array.from(new Set(userRooms.map(ur => ur.roomId)));
  ids.forEach((id) => {
    const u = onSnapshot(doc(db, 'rooms', id), (d) => {
      if (d.exists()) map.set(id, { id, ...(d.data() as any) } as Room);
      else map.delete(id);
      cb(Array.from(map.values()));
    });
    unsubs.push(u);
  });
  return () => unsubs.forEach(u => u());
}

export type Booking = {
  id: string;
  start: any; // Timestamp
  end: any; // Timestamp
  description?: string;
  createdBy: string;
  createdAt: any; // Timestamp
};


function toTimestamp(d: Date) {
  return Timestamp.fromDate(d);
}


export async function hasBookingConflict(roomId: string, start: Date, end: Date, excludeId?: string) {
// 1) Ищем все брони, у которых start < newEnd
  const q1 = query(
    collection(db, 'rooms', roomId, 'bookings'),
    where('start', '<', toTimestamp(end))
  );
  const snap = await getDocs(q1);
// 2) Клиентская фильтрация: end > newStart и (не тот же id)
  return snap.docs.some(d => {
    if (excludeId && d.id === excludeId) return false;
    const data = d.data() as any;
    const bEnd = data.end?.toDate?.() as Date | undefined;
    if (!bEnd) return false;
    return bEnd > start; // значит есть пересечение
  });
}

export async function createBooking(roomId: string, params: { start: Date; end: Date; description?: string; createdBy: string; }) {
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


export async function updateBooking(roomId: string, bookingId: string, patch: { start?: Date; end?: Date; description?: string }) {
  const ref = doc(db, 'rooms', roomId, 'bookings', bookingId);
  const cur = await getDoc(ref);
  if (!cur.exists()) throw new Error('Booking not found');
  const data = cur.data() as any;
  const start = patch.start ?? data.start.toDate();
  const end = patch.end ?? data.end.toDate();
  if (end <= start) throw new Error('End must be after start');


  const conflict = await hasBookingConflict(roomId, start, end, bookingId);
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
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => (a.start?.toMillis?.() ?? 0) - (b.start?.toMillis?.() ?? 0));
    cb(list as Booking[]);
  });
}

export function watchRoomsForUser(
  params: { uid?: string; email?: string },
  cb: (rooms: Room[]) => void
) {
  const unsubscribers: Array<() => void> = [];
  const roomsMap = new Map<string, Room>();

  const emit = () =>
    cb(
      Array.from(roomsMap.values()).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      )
    );

  const attachRoomsListenerForMemberDocs = (memberDocPaths: string[]) => {
    const uniqueRoomIds = new Set<string>();
    for (const path of memberDocPaths) {
      const parts = path.split('/');
      const roomId = parts[1];
      if (roomId) uniqueRoomIds.add(roomId);
    }

    uniqueRoomIds.forEach((roomId) => {
      const unsub = onSnapshot(doc(db, 'rooms', roomId), (d) => {
        if (d.exists()) {
          roomsMap.set(d.id, { id: d.id, ...(d.data() as any) } as Room);
        } else {
          roomsMap.delete(d.id);
        }
        emit();
      });
      unsubscribers.push(unsub);
    });
  };

  if (params.uid) {
    const q1 = query(collectionGroup(db, 'members'), where('userId', '==', params.uid));
    const u1 = onSnapshot(q1, (snap) => {
      attachRoomsListenerForMemberDocs(snap.docs.map((d) => d.ref.path));
    });
    unsubscribers.push(u1);
  }

  if (params.email) {
    const q2 = query(collectionGroup(db, 'members'), where('email', '==', params.email));
    const u2 = onSnapshot(q2, (snap) => {
      attachRoomsListenerForMemberDocs(snap.docs.map((d) => d.ref.path));
    });
    unsubscribers.push(u2);
  }

  return () => unsubscribers.forEach((u) => u());
}

/*
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
  type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from './config';
import type { UpdateData } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';

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
  userId: string | null;
  email: string;
  role: MemberRole;
  addedAt: Timestamp | null;
};

type MemberDoc = {
  userId: string | null;
  email: string;
  role: MemberRole;
  addedAt: Timestamp | null;
};

const memberConverter: FirestoreDataConverter<MemberDoc> = {
  toFirestore: (d) => d,
  fromFirestore: (snap) => snap.data() as MemberDoc,
};

const membersCol = (roomId: string) =>
  collection(db, 'rooms', roomId, 'members').withConverter(memberConverter);

const memberRef = (roomId: string, memberId: string) =>
  doc(membersCol(roomId), memberId);

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
  patch: Partial<Pick<Room, 'name' | 'description'>>
) {
  await updateDoc(doc(db, 'rooms', roomId), patch as any);
}

export async function deleteRoom(roomId: string) {
  const mRef = collection(db, 'rooms', roomId, 'members');
  const snap = await getDocs(mRef);
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
  m: { userId?: string; email: string; role: MemberRole }
) {
  await addDoc(membersCol(roomId), {
    userId: m.userId ?? null,
    email: m.email,
    role: m.role,
    addedAt: serverTimestamp() as unknown as Timestamp | null,
  });
}

export async function updateMemberRole(
  roomId: string,
  memberId: string,
  role: MemberRole
) {
  await updateDoc<MemberDoc>(
    memberRef(roomId, memberId),
    { role } as UpdateData<MemberDoc>
  );
}

export async function removeMember(roomId: string, memberId: string) {
  await deleteDoc(memberRef(roomId, memberId));
}

export function watchRoomMembers(
  roomId: string,
  cb: (members: RoomMember[]) => void
) {
  return onSnapshot(membersCol(roomId), (snap) => {
    const list: RoomMember[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    cb(list);
  });
}

export function watchRoomsForUser(
  params: { uid?: string; email?: string },
  cb: (rooms: Room[]) => void
) {
  const unsubscribers: Array<() => void> = [];
  const roomsMap = new Map<string, Room>();

  const emit = () =>
    cb(
      Array.from(roomsMap.values()).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      )
    );

  const attachRoomsListenerForMemberDocs = (memberDocPaths: string[]) => {
    const uniqueRoomIds = new Set<string>();
    for (const path of memberDocPaths) {
      const parts = path.split('/');
      const roomId = parts[1];
      if (roomId) uniqueRoomIds.add(roomId);
    }

    uniqueRoomIds.forEach((roomId) => {
      const unsub = onSnapshot(doc(db, 'rooms', roomId), (d) => {
        if (d.exists()) {
          roomsMap.set(d.id, { id: d.id, ...(d.data() as any) } as Room);
        } else {
          roomsMap.delete(d.id);
        }
        emit();
      });
      unsubscribers.push(unsub);
    });
  };

  if (params.uid) {
    const q1 = query(collectionGroup(db, 'members'), where('userId', '==', params.uid));
    const u1 = onSnapshot(q1, (snap) => {
      attachRoomsListenerForMemberDocs(snap.docs.map((d) => d.ref.path));
    });
    unsubscribers.push(u1);
  }

  if (params.email) {
    const q2 = query(collectionGroup(db, 'members'), where('email', '==', params.email));
    const u2 = onSnapshot(q2, (snap) => {
      attachRoomsListenerForMemberDocs(snap.docs.map((d) => d.ref.path));
    });
    unsubscribers.push(u2);
  }

  return () => unsubscribers.forEach((u) => u());
}
*/



/*робоча версія*/
/*
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export type MemberRole = 'admin' | 'user';
export type Room = { id: string; name: string; description?: string; createdBy: string; createdAt: any };
export type UserRoom = { id: string; userId?: string | null; email: string; roomId: string; role: MemberRole; addedAt: any };

export async function createRoom(params: { name: string; description?: string; createdBy: string; email?: string }) {
  const r = await addDoc(collection(db, 'rooms'), {
    name: params.name,
    description: params.description ?? '',
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });
  await addUserRoom({ userId: params.createdBy, email: params.email ?? '', roomId: r.id, role: 'admin' });
  return r.id;
}

export async function updateRoom(roomId: string, patch: Partial<Pick<Room,'name'|'description'>>) {
  await updateDoc(doc(db, 'rooms', roomId), patch as any);
}

export async function deleteRoom(roomId: string) {
  const qIdx = query(collection(db, 'userRooms'), where('roomId', '==', roomId));
  const snap = await getDocs(qIdx);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const d = await getDoc(doc(db, 'rooms', roomId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as any) } as Room;
}

export async function addUserRoom(m: { userId?: string | null; email: string; roomId: string; role: MemberRole }) {
  await addDoc(collection(db, 'userRooms'), {
    userId: m.userId ?? null,
    email: m.email,
    roomId: m.roomId,
    role: m.role,
    addedAt: serverTimestamp(),
  });
}

export async function removeUserRoom(userRoomId: string) {
  await deleteDoc(doc(db, 'userRooms', userRoomId));
}

export async function updateUserRoomRole(userRoomId: string, role: MemberRole) {
  await setDoc(doc(db, 'userRooms', userRoomId), { role }, { merge: true });
}

export function watchMyUserRooms(params: { uid?: string; email?: string }, cb: (list: UserRoom[]) => void) {
  const unsubs: Array<() => void> = [];
  const emit = (docs: any[]) => cb(docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UserRoom[]);

  if (params.uid) {
    const q1 = query(collection(db, 'userRooms'), where('userId', '==', params.uid));
    unsubs.push(onSnapshot(q1, (snap) => emit(snap.docs)));
  }
  if (params.email) {
    const q2 = query(collection(db, 'userRooms'), where('email', '==', params.email));
    unsubs.push(onSnapshot(q2, (snap) => emit(snap.docs)));
  }
  return () => unsubs.forEach(u => u());
}

export function watchRoomsByIndex(userRooms: UserRoom[], cb: (rooms: Room[]) => void) {
  const unsubs: Array<() => void> = [];
  const map = new Map<string, Room>();
  const ids = Array.from(new Set(userRooms.map(ur => ur.roomId)));
  ids.forEach((id) => {
    const u = onSnapshot(doc(db, 'rooms', id), (d) => {
      if (d.exists()) map.set(id, { id, ...(d.data() as any) } as Room);
      else map.delete(id);
      cb(Array.from(map.values()));
    });
    unsubs.push(u);
  });
  return () => unsubs.forEach(u => u());
}*/
