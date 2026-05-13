import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  auth,
  db,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from './firebase.js';
import { byId, candidateLabel, createProgressRow, downloadBlob, groupByParticipation, makeAccessCode, percent, showMessage } from './shared.js';

const state = { students: [], candidates: [], votes: [], electionStatus: 'closed' };
const loginPanel = byId('loginPanel');
const adminPanel = byId('adminPanel');
const adminAccessNotice = byId('adminAccessNotice');
const adminAccessMessage = byId('adminAccessMessage');
const adminDocPath = byId('adminDocPath');
const loginForm = byId('loginForm');
const loginMessage = byId('loginMessage');
const logoutBtn = byId('logoutBtn');
const studentForm = byId('studentForm');
const candidateForm = byId('candidateForm');
const studentMessage = byId('studentMessage');
const candidateMessage = byId('candidateMessage');
let unsubscribers = [];

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  try {
    await signInWithEmailAndPassword(auth, data.get('email'), data.get('password'));
    loginForm.reset();
  } catch (error) {
    showMessage(loginMessage, error.message, 'error');
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  loginPanel.hidden = Boolean(user);
  adminPanel.hidden = true;
  adminAccessNotice.hidden = true;
  logoutBtn.hidden = !user;

  if (!user) return;

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      adminDocPath.textContent = `admins/${user.uid}`;
      adminAccessMessage.textContent = `Signed in as ${user.email || user.uid}, but this account is not allow-listed as an election admin.`;
      adminAccessNotice.hidden = false;
      return;
    }
    adminPanel.hidden = false;
    subscribeAdminData();
  } catch (error) {
    adminAccessMessage.textContent = `Admin permission check failed: ${formatFirebaseError(error)}`;
    adminAccessNotice.hidden = false;
  }
});


function formatFirebaseError(error) {
  if (error?.code === 'permission-denied') {
    return 'Missing or insufficient permissions. Make sure firestore.rules is published and this user has an admins/{uid} document.';
  }
  return error?.message || 'Unknown Firebase error.';
}

function snapshotError(area) {
  return (error) => {
    adminAccessMessage.textContent = `${area} listener failed: ${formatFirebaseError(error)}`;
    adminAccessNotice.hidden = false;
  };
}

function subscribeAdminData() {
  unsubscribers.push(
    onSnapshot(query(collection(db, 'students'), orderBy('rollNumber', 'asc')), (snapshot) => {
      state.students = snapshot.docs.map((studentDoc) => ({ id: studentDoc.id, ...studentDoc.data() }));
      renderAll();
    }, snapshotError('Students')),
    onSnapshot(query(collection(db, 'candidates'), orderBy('createdAt', 'asc')), (snapshot) => {
      state.candidates = snapshot.docs.map((candidateDoc) => ({ id: candidateDoc.id, ...candidateDoc.data() }));
      renderAll();
    }, snapshotError('Candidates')),
    onSnapshot(query(collection(db, 'votes'), orderBy('timestamp', 'desc')), (snapshot) => {
      state.votes = snapshot.docs.map((voteDoc) => ({ id: voteDoc.id, ...voteDoc.data() }));
      renderAll();
    }, snapshotError('Votes')),
    onSnapshot(doc(db, 'settings', 'election'), (snapshot) => {
      state.electionStatus = snapshot.exists() ? snapshot.data().status : 'closed';
      renderAll();
    }, snapshotError('Election settings')),
  );
}

function renderAll() {
  const voted = state.students.filter((student) => student.voted).length;
  byId('totalStudents').textContent = state.students.length;
  byId('totalVotes').textContent = state.votes.length || voted;
  byId('pollPercent').textContent = `${percent(voted, state.students.length)}%`;
  byId('adminStatus').textContent = state.electionStatus === 'open' ? 'Open' : 'Closed';
  renderStudents();
  renderCandidates();
  renderResults();
  renderAnalytics();
}

function renderStudents() {
  byId('studentsTable').innerHTML = state.students
    .map((student) => {
      const accessUrl = `${location.origin}${location.pathname.replace('admin.html', 'index.html')}?student=${encodeURIComponent(student.id)}&access=${encodeURIComponent(student.accessCode || '')}`;
      return `<tr>
        <td>${student.rollNumber || ''}</td><td>${student.name || ''}</td><td>${student.className || ''}</td><td>${student.section || ''}</td><td>${student.gender || ''}</td><td>${student.voted ? 'Yes' : 'No'}</td>
        <td><button class="link-btn" data-copy="${accessUrl}">Copy Link</button></td>
        <td><button class="link-btn" data-edit-student="${student.id}">Edit</button><button class="link-btn danger-text" data-delete-student="${student.id}">Delete</button></td>
      </tr>`;
    })
    .join('');
}

function renderCandidates() {
  byId('candidateList').innerHTML = state.candidates
    .map((candidate) => `<div class="mini-item"><span><strong>${candidateLabel(candidate)}</strong><small>${candidate.group} • ${candidate.active === false ? 'Inactive' : 'Active'}</small></span><span><button class="link-btn" data-edit-candidate="${candidate.id}">Edit</button><button class="link-btn danger-text" data-delete-candidate="${candidate.id}">Delete</button></span></div>`)
    .join('');
}

function resultCounts(group) {
  return state.candidates
    .filter((candidate) => candidate.group === group)
    .map((candidate) => ({ ...candidate, votes: state.votes.filter((vote) => vote[group === 'boy' ? 'selectedBoyCandidate' : 'selectedGirlCandidate'] === candidate.id).length }))
    .sort((a, b) => b.votes - a.votes);
}

function renderResults() {
  const boys = resultCounts('boy');
  const girls = resultCounts('girl');
  byId('resultsList').innerHTML = [...boys, ...girls].map((candidate) => createProgressRow({ label: `${candidate.name} (${candidate.group})`, voted: candidate.votes, total: Math.max(state.votes.length, 1) })).join('');
  byId('boyWinner').textContent = boys[0] ? `${boys[0].name} (${boys[0].votes} votes)` : 'Pending';
  byId('girlWinner').textContent = girls[0] ? `${girls[0].name} (${girls[0].votes} votes)` : 'Pending';
}

function renderAnalytics() {
  byId('classAnalytics').innerHTML = groupByParticipation(state.students, 'className').map(createProgressRow).join('');
  byId('genderAnalytics').innerHTML = groupByParticipation(state.students, 'gender').map(createProgressRow).join('');
  byId('sectionAnalytics').innerHTML = groupByParticipation(state.students, 'section').map(createProgressRow).join('');
}

document.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.copy) {
    await navigator.clipboard.writeText(target.dataset.copy);
    target.textContent = 'Copied';
  }
  if (target.dataset.editStudent) fillStudentForm(state.students.find((student) => student.id === target.dataset.editStudent));
  if (target.dataset.deleteStudent && confirm('Delete this student record?')) {
    try {
      await deleteDoc(doc(db, 'students', target.dataset.deleteStudent));
      showMessage(studentMessage, 'Student deleted successfully.', 'info');
    } catch (error) {
      showMessage(studentMessage, formatFirebaseError(error), 'error');
    }
  }
  if (target.dataset.editCandidate) fillCandidateForm(state.candidates.find((candidate) => candidate.id === target.dataset.editCandidate));
  if (target.dataset.deleteCandidate && confirm('Delete this candidate?')) {
    try {
      await deleteDoc(doc(db, 'candidates', target.dataset.deleteCandidate));
      showMessage(candidateMessage, 'Candidate deleted successfully.', 'info');
    } catch (error) {
      showMessage(candidateMessage, formatFirebaseError(error), 'error');
    }
  }
});

studentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(studentForm));
  const payload = {
    rollNumber: data.rollNumber.trim(),
    name: data.name.trim(),
    className: data.className.trim(),
    section: data.section.trim(),
    gender: data.gender,
    updatedAt: serverTimestamp(),
  };
  try {
    if (data.id) await updateDoc(doc(db, 'students', data.id), payload);
    else await addDoc(collection(db, 'students'), { ...payload, accessCode: makeAccessCode(), voted: false, createdAt: serverTimestamp() });
    studentForm.reset();
    showMessage(studentMessage, 'Student saved successfully.', 'info');
  } catch (error) {
    showMessage(studentMessage, formatFirebaseError(error), 'error');
  }
});

candidateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(candidateForm));
  const payload = { name: data.name.trim(), group: data.group, symbol: data.symbol.trim(), description: data.description.trim(), active: data.active === 'on', updatedAt: serverTimestamp() };
  try {
    if (data.id) await updateDoc(doc(db, 'candidates', data.id), payload);
    else await addDoc(collection(db, 'candidates'), { ...payload, createdAt: serverTimestamp() });
    candidateForm.reset();
    candidateForm.elements.active.checked = true;
    showMessage(candidateMessage, 'Candidate saved successfully.', 'info');
  } catch (error) {
    showMessage(candidateMessage, formatFirebaseError(error), 'error');
  }
});

function fillStudentForm(student) {
  if (!student) return;
  studentForm.elements.id.value = student.id;
  studentForm.elements.rollNumber.value = student.rollNumber || '';
  studentForm.elements.name.value = student.name || '';
  studentForm.elements.className.value = student.className || '';
  studentForm.elements.section.value = student.section || '';
  studentForm.elements.gender.value = student.gender || 'Boy';
  studentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function fillCandidateForm(candidate) {
  if (!candidate) return;
  candidateForm.elements.id.value = candidate.id;
  candidateForm.elements.name.value = candidate.name || '';
  candidateForm.elements.group.value = candidate.group || 'boy';
  candidateForm.elements.symbol.value = candidate.symbol || '';
  candidateForm.elements.description.value = candidate.description || '';
  candidateForm.elements.active.checked = candidate.active !== false;
}

byId('clearStudentForm').addEventListener('click', () => studentForm.reset());
byId('clearCandidateForm').addEventListener('click', () => { candidateForm.reset(); candidateForm.elements.active.checked = true; });
byId('startVotingBtn').addEventListener('click', async () => {
  try {
    await setDoc(doc(db, 'settings', 'election'), { status: 'open', updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    alert(formatFirebaseError(error));
  }
});
byId('stopVotingBtn').addEventListener('click', async () => {
  try {
    await setDoc(doc(db, 'settings', 'election'), { status: 'closed', updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    alert(formatFirebaseError(error));
  }
});
byId('resetElectionBtn').addEventListener('click', async () => {
  if (!confirm('Reset all votes and mark every student as not voted?')) return;
  try {
    const batch = writeBatch(db);
    state.students.forEach((student) => batch.update(doc(db, 'students', student.id), { voted: false, votedAt: null, selectedBoyCandidate: null, selectedGirlCandidate: null }));
    state.votes.forEach((vote) => batch.delete(doc(db, 'votes', vote.id)));
    batch.set(doc(db, 'settings', 'election'), { status: 'closed', updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  } catch (error) {
    alert(formatFirebaseError(error));
  }
});

byId('exportCsvBtn').addEventListener('click', () => {
  const rows = [['Student ID', 'Name', 'Class', 'Section', 'Gender', 'Boy Candidate', 'Girl Candidate', 'Timestamp'], ...state.votes.map((vote) => [vote.studentId, vote.name, vote.className, vote.section, vote.gender, vote.selectedBoyCandidate, vote.selectedGirlCandidate, vote.timestamp?.toDate?.().toISOString?.() || ''])];
  downloadBlob('madrasa-election-results.csv', rows.map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv');
});

byId('exportPdfBtn').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text('Madrasa Election Results', 14, 20);
  pdf.setFontSize(11);
  pdf.text(`Total students: ${state.students.length}`, 14, 34);
  pdf.text(`Total votes: ${state.votes.length}`, 14, 42);
  pdf.text(`Boy winner: ${byId('boyWinner').textContent}`, 14, 50);
  pdf.text(`Girl winner: ${byId('girlWinner').textContent}`, 14, 58);
  pdf.save('madrasa-election-results.pdf');
});
