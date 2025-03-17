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

// ✅ **确保 /v1/ 代理到 Ollama，并正确转发路径**
app.use('/v1/', createProxyMiddleware({
    target: OLLAMA_URL,
    changeOrigin: true,

    // 🔥 **确保不修改 /v1/ 路径，因为 Ollama 需要它**
    pathRewrite: {},

    // ✅ 代理日志，确认请求是否正确进入代理
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🟢 Proxying request: ${req.method} ${req.originalUrl} → ${OLLAMA_URL}${req.originalUrl}`);
    },

    // ✅ 代理错误日志
    onError: (err, req, res) => {
        console.error('🔴 Proxy Error:', err);
        res.status(500).json({ error: 'Proxy failed', details: err.message });
    }
}));

// ✅ 确保监听 0.0.0.0
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});
