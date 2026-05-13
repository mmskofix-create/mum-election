import { db, collection, doc, query, orderBy, onSnapshot } from './firebase.js';
import { byId, createProgressRow, groupByParticipation, percent } from './shared.js';

const state = { students: [], status: 'closed' };

onSnapshot(query(collection(db, 'students'), orderBy('rollNumber', 'asc')), (snapshot) => {
  state.students = snapshot.docs.map((studentDoc) => ({ id: studentDoc.id, ...studentDoc.data() }));
  render();
});

onSnapshot(doc(db, 'settings', 'election'), (snapshot) => {
  state.status = snapshot.exists() ? snapshot.data().status : 'closed';
  render();
});

function render() {
  const total = state.students.length;
  const voted = state.students.filter((student) => student.voted).length;
  const polling = percent(voted, total);
  byId('liveStatus').textContent = state.status === 'open' ? 'Open' : 'Closed';
  byId('livePercent').textContent = `${polling}%`;
  byId('liveVoted').textContent = voted;
  byId('liveTotal').textContent = total;
  byId('circlePercent').textContent = `${polling}%`;
  byId('overallLabel').textContent = `${polling}%`;
  byId('overallBar').style.width = `${polling}%`;
  document.querySelector('.circle-chart').style.setProperty('--value', `${polling * 3.6}deg`);
  byId('liveClass').innerHTML = groupByParticipation(state.students, 'className').map(createProgressRow).join('');
  byId('liveGender').innerHTML = groupByParticipation(state.students, 'gender').map(createProgressRow).join('');
  byId('liveSection').innerHTML = groupByParticipation(state.students, 'section').map(createProgressRow).join('');
}

setInterval(() => {
  byId('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);
