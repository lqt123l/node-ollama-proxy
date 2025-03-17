const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const cors = require('cors');

const OLLAMA_URL = 'http://localhost:11434';
const API_KEY = 'demo';

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('combined'));

app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

app.use('/', createProxyMiddleware({
    target: OLLAMA_URL,
    changeOrigin: true,
    logLevel: 'debug',

    onProxyReq: (proxyReq, req, res) => {
        console.log(`🟢 Proxying request: ${req.method} ${req.originalUrl} → ${OLLAMA_URL}${req.url}`);
    },

    onError: (err, req, res) => {
        console.error('🔴 Proxy Error:', err);
        res.status(500).json({ error: 'Proxy failed', details: err.message });
    }
}));

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});
