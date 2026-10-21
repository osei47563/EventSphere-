import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Paystack proxy route
app.use(express.json());
app.post('/api/paystack/charge', async (req, res) => {
    const { email, amount, currency } = req.body;
    
    // In a real application, you would use axios or fetch to call the Paystack API
    // using process.env.PAYSTACK_SECRET_KEY
    
    res.json({ status: 'success', message: 'Mock Paystack proxy response' });
});

// For development in AI Studio, we need to integrate with Vite's dev server
// However, the instructions say "use server-side proxy routes (/api/*)".
// The instructions also say "Never mount Express inside vite.config.ts."
// And "run Express with vite.middlewares mounted in dev".

import { createServer } from 'vite';

async function startServer() {
    const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    app.use(vite.middlewares);

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
