const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const API_URL = process.env.API_URL || 'http://backend:5000';

// Proxy /api requests to the backend
app.use(
  '/api',
  createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/' },
    timeout: 120000,
    proxyTimeout: 120000,
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
