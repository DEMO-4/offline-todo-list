importScripts('./ngsw-worker.js');

function fetchTasks() {
  return fetch('http://localhost:3000/tasks', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(() => Promise.resolve())
    .catch(() => Promise.reject());
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(fetchTasks());
  }
});
