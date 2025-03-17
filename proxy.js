const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const cors = require('cors');

const OLLAMA_URL = 'http://localhost:11434';  // Ollama 服务器地址
const API_KEY = 'demo';  // 你的 API Key

const app = express();

// ✅ 允许所有 CORS 请求
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ 日志记录
app.use(morgan('combined'));

// ✅ API Key 验证
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// ✅ **代理 /v1/ 请求，确保正确转发**
app.use('/v1/', createProxyMiddleware({
    target: OLLAMA_URL,
    changeOrigin: false,  // ❗ 让 Host 保持一致
    logLevel: 'debug',    // 🔥 让日志更详细

    // ✅ **确保路径不会被修改**
    pathRewrite: {},

    // ✅ **打印代理路径**
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🟢 Proxying request: ${req.method} ${req.originalUrl} → ${OLLAMA_URL}${req.url}`);
    },

    // ✅ **代理错误日志**
    onError: (err, req, res) => {
        console.error('🔴 Proxy Error:', err);
        res.status(500).json({ error: 'Proxy failed', details: err.message });
    }
}));

// ✅ **监听 0.0.0.0**
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servers are running on http://0.0.0.0:${PORT}`);
});
