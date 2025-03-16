const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const cors = require('cors');

const OLLAMA_URL = 'http://localhost:11434';
const API_KEY = 'demo';

const app = express();

// 允许所有来源的 CORS 请求
app.use(cors({
    origin: '*', // 允许所有来源的请求（生产环境下可以限制特定域名）
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 日志中间件
app.use(morgan('combined'));

// API 密钥验证
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// 代理 /v1/ 请求
app.use('/v1/', createProxyMiddleware({
    target: OLLAMA_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        if (req.headers.accept === 'text/event-stream') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }

        // 添加 CORS 头部
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    },
    selfHandleResponse: false,
}));

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
