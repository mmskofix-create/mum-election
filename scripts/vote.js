import {
  db,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
} from './firebase.js';
import { byId, candidateLabel, showMessage } from './shared.js';

const params = new URLSearchParams(window.location.search);
const accessCode = params.get('access') || params.get('token') || '';
const studentIdParam = params.get('student') || '';
const form = byId('voteForm');
const accessNotice = byId('accessNotice');
const successNotice = byId('successNotice');
const alreadyNotice = byId('alreadyNotice');
const statusNode = byId('electionStatus');
const boyList = byId('boyCandidates');
const girlList = byId('girlCandidates');
const voteMessage = byId('voteMessage');

let studentDocId = null;
let studentData = null;
let candidates = [];
let electionOpen = false;

function renderCandidates() {
  const renderGroup = (group, container) => {
    const items = candidates.filter((candidate) => candidate.group === group && candidate.active !== false);
    container.innerHTML = items
      .map(
        (candidate) => `
          <label class="candidate-card">
            <input type="radio" name="${group}" value="${candidate.id}" required />
            <span class="candidate-avatar">${candidate.name.slice(0, 1).toUpperCase()}</span>
            <span><strong>${candidateLabel(candidate)}</strong><small>${candidate.description || 'Student representative candidate'}</small></span>
          </label>
        `,
      )
      .join('');
  };
  renderGroup('boy', boyList);
  renderGroup('girl', girlList);
}

function updateVisibility() {
  const canVote = accessCode && studentData && !studentData.voted && electionOpen;
  accessNotice.hidden = Boolean(accessCode && studentIdParam);
  alreadyNotice.hidden = !(studentData?.voted);
  form.hidden = !canVote;
  if (!electionOpen) {
    statusNode.textContent = 'Voting is currently closed';
    statusNode.classList.add('closed');
  } else {
    statusNode.textContent = 'Voting is open';
    statusNode.classList.remove('closed');
  }
}

async function loadStudent() {
  if (!accessCode || !studentIdParam) {
    updateVisibility();
    return;
  }
  const studentSnap = await getDoc(doc(db, 'students', studentIdParam));
  if (!studentSnap.exists() || studentSnap.data().accessCode !== accessCode) {
    accessNotice.hidden = false;
    accessNotice.querySelector('p').textContent = 'This voting link is invalid. Please collect your correct access link from the control room.';
    return;
  }
  studentDocId = studentSnap.id;
  studentData = studentSnap.data();
  updateVisibility();
}

onSnapshot(doc(db, 'settings', 'election'), (snapshot) => {
  electionOpen = snapshot.exists() ? snapshot.data().status === 'open' : false;
  updateVisibility();
});

onSnapshot(query(collection(db, 'candidates'), orderBy('createdAt', 'asc')), (snapshot) => {
  candidates = snapshot.docs.map((candidateDoc) => ({ id: candidateDoc.id, ...candidateDoc.data() }));
  renderCandidates();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const boyCandidateId = new FormData(form).get('boy');
  const girlCandidateId = new FormData(form).get('girl');
  if (!boyCandidateId || !girlCandidateId) {
    showMessage(voteMessage, 'Please select one boy candidate and one girl candidate.', 'error');
    return;
  }
  if (!studentDocId) return;

  try {
    await runTransaction(db, async (transaction) => {
      const studentRef = doc(db, 'students', studentDocId);
      const electionRef = doc(db, 'settings', 'election');
      const voteRef = doc(db, 'votes', studentDocId);
      const studentSnap = await transaction.get(studentRef);
      const electionSnap = await transaction.get(electionRef);

      if (!electionSnap.exists() || electionSnap.data().status !== 'open') throw new Error('Voting is currently closed.');
      if (!studentSnap.exists()) throw new Error('Invalid voting access.');
      const freshStudent = studentSnap.data();
      if (freshStudent.voted) throw new Error('You have already voted.');

      const voteRecord = {
        studentId: studentDocId,
        name: freshStudent.name,
        className: freshStudent.className,
        section: freshStudent.section,
        gender: freshStudent.gender,
        selectedBoyCandidate: boyCandidateId,
        selectedGirlCandidate: girlCandidateId,
        timestamp: serverTimestamp(),
      };

      transaction.set(voteRef, voteRecord);
      transaction.update(studentRef, {
        voted: true,
        votedAt: serverTimestamp(),
        selectedBoyCandidate: boyCandidateId,
        selectedGirlCandidate: girlCandidateId,
      });
    });

    form.hidden = true;
    successNotice.hidden = false;
  } catch (error) {
    showMessage(voteMessage, error.message, error.message.includes('already') ? 'warning' : 'error');
    if (error.message.includes('already')) {
      alreadyNotice.hidden = false;
      form.hidden = true;
    }
  }
});

loadStudent().catch((error) => {
  accessNotice.hidden = false;
  accessNotice.querySelector('p').textContent = error.message;
});
