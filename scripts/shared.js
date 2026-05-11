export const byId = (id) => document.getElementById(id);

export function setThemeFromStorage() {
  const saved = localStorage.getItem('election-theme');
  if (saved === 'dark') document.documentElement.classList.add('dark');
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('election-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  });
}

export function candidateLabel(candidate) {
  return `${candidate.name}${candidate.symbol ? ` • ${candidate.symbol}` : ''}`;
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function groupByParticipation(students, key) {
  const grouped = new Map();
  students.forEach((student) => {
    const label = student[key] || 'Not assigned';
    const current = grouped.get(label) || { label, total: 0, voted: 0 };
    current.total += 1;
    if (student.voted) current.voted += 1;
    grouped.set(label, current);
  });
  return [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function createProgressRow({ label, voted, total }) {
  const value = percent(voted, total);
  return `
    <div class="progress-row">
      <div class="progress-meta"><span>${label}</span><strong>${value}%</strong></div>
      <div class="progress-track"><span style="width:${value}%"></span></div>
      <small>${voted} of ${total} voted</small>
    </div>
  `;
}

export function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function makeAccessCode() {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ME-${segment()}-${segment()}`;
}

export function showMessage(node, message, tone = 'info') {
  node.textContent = message;
  node.className = `form-message ${tone}`;
}

setThemeFromStorage();
