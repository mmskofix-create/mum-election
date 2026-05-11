import { db, serverTimestamp, collection, addDoc, doc, setDoc } from './firebase.js';

const defaults = [
  { name: 'Boy Candidate 1', group: 'boy', symbol: 'Blue House', description: 'Candidate for boy representative', active: true },
  { name: 'Boy Candidate 2', group: 'boy', symbol: 'Green House', description: 'Candidate for boy representative', active: true },
  { name: 'Girl Candidate 1', group: 'girl', symbol: 'Red House', description: 'Candidate for girl representative', active: true },
  { name: 'Girl Candidate 2', group: 'girl', symbol: 'Yellow House', description: 'Candidate for girl representative', active: true },
];

export async function seedDefaultElection() {
  await setDoc(doc(db, 'settings', 'election'), { status: 'closed', updatedAt: serverTimestamp() }, { merge: true });
  await Promise.all(defaults.map((candidate) => addDoc(collection(db, 'candidates'), { ...candidate, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })));
}
