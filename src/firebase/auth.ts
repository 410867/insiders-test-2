import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User } from 'firebase/auth';

import { auth } from './config';

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (cred.user && name) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred.user;
}

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}
