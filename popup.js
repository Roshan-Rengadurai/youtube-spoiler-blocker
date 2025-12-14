const STORAGE_KEY = 'spoilerGuardSettings';

function parseList(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function hydrateList(lines) {
  return lines.join('\n');
}

function loadSettings() {
  chrome.storage.sync.get(STORAGE_KEY, (result) => {
    const stored = result[STORAGE_KEY] || { channels: [], topics: [] };
    document.getElementById('channels').value = hydrateList(stored.channels || []);
    document.getElementById('topics').value = hydrateList(stored.topics || []);
  });
}

function saveSettings() {
  const channels = parseList(document.getElementById('channels').value).map((c) => c.toLowerCase());
  const topics = parseList(document.getElementById('topics').value).map((t) => t.toLowerCase());

  chrome.storage.sync.set({ [STORAGE_KEY]: { channels, topics } }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved. Reload the video tab if needed.';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('save').addEventListener('click', saveSettings);
});
