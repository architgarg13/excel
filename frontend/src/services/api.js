import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
});

export function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return client.post('/upload', formData, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    },
  });
}

export function getFiles() {
  return client.get('/files');
}
