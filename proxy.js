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


app.options('*', (req, res) => {
    res.status(204).end();
});

app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

app.use('/v1/', createProxyMiddleware({
    target: OLLAMA_URL,
    changeOrigin: true,

    pathRewrite: { '^/v1/': '/' },

    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.originalUrl} → ${OLLAMA_URL}${req.originalUrl.replace(/^\/v1\//, '/')}`);
    },

    onProxyRes: (proxyRes, req, res) => {
        if (req.headers.accept === 'text/event-stream') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
    },

    selfHandleResponse: false,
}));

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});
