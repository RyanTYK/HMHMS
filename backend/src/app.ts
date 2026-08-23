import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables FIRST before importing any modules that use them
dotenv.config();

import express from 'express';
import cors from 'cors';
import passport from './config/passport';
import { AppDataSource } from './utils/data-source';
import { sseManager } from './utils/sseManager';
import monitorRoutes from './routes/monitorRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import bulkImportRoutes from './routes/bulkImportRoutes';
import jwt from 'jsonwebtoken';
import { initJwtSecret, getJwtSecret } from './utils/jwtSecret';

const app = express();

// Basic middleware
app.use(express.json());
app.use(
	cors({
		// Accept either spelling; CORS_ORIGINS is what .env/.env.example use.
		origin: (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS)?.split(',').map(o => o.trim()).filter(Boolean)
			|| ['http://localhost:5173'],
		credentials: true,
	})
);

// Initialize Passport
app.use(passport.initialize());

// Health endpoint
app.get('/health', (_req: express.Request, res: express.Response) => res.json({ status: 'ok' }));

// SSE endpoint for real-time updates (requires auth token)
app.get('/api/events', async (req: express.Request, res: express.Response) => {
	try {
		const authHeader = req.headers['authorization'];
		const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string | undefined);
		if (!token) return res.status(401).end();
		const decoded: any = jwt.verify(token, getJwtSecret());

		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});

		// Add client to SSE manager for this user
		sseManager.addClient(decoded.id, res);

		// Send initial data for this user
		await sseManager.broadcastMonitors(decoded.id);

		// Set up periodic updates (as backup)
		const interval = setInterval(() => {
			sseManager.broadcastMonitors(decoded.id);
		}, 30000);

		req.on('close', () => clearInterval(interval));
	} catch (err) {
		res.status(403).end();
	}
});

// Routes
app.use('/api/monitors', monitorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bulk-import', bulkImportRoutes);

// Central error handler: guarantees a response is sent when a route throws,
// instead of leaving the request hanging until the client times out.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('[API] Unhandled route error:', err?.stack || err?.message || err);
	if (res.headersSent) return;
	res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Initialize DB and start server if run directly
const PORT = Number(process.env.PORT) || 3000;

AppDataSource.initialize()
	.then(async () => {
		console.log('Data Source has been initialized!');
		await initJwtSecret();
		app.listen(PORT, () => {
			console.log(`Backend listening on http://localhost:${PORT}`);
		});
	})
	.catch((err: Error) => {
		console.error('Error during Data Source initialization:', err);
	});

export default app;