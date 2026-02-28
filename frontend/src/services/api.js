import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
});

export function createSession() {
  return client.post('/session');
}

export function uploadSheet(sessionId, sheetType, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return client.post(`/session/${sessionId}/upload/${sheetType}`, formData, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    },
  });
}

export function pasteSheet(sessionId, sheetType, rows) {
  return client.post(`/session/${sessionId}/paste/${sheetType}`, { rows });
}

export function saveMapping(sessionId, sheetType, mapping) {
  return client.put(`/session/${sessionId}/mapping/${sheetType}`, { mapping });
}

export function getSessionStatus(sessionId) {
  return client.get(`/session/${sessionId}/status`);
}

export function generateOutput(sessionId) {
  return client.post(`/session/${sessionId}/generate`);
}

export function getDownloadUrl(sessionId) {
  return `/api/session/${sessionId}/download`;
}
