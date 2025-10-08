/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: index.ts
 * Tools: express, dotenv, cors
 * Description:
 * This file initializes the Express application and sets up the middleware and
 * routes.
 * It loads environment variables using dotenv and configures CORS to allow
 * requests
 * from the frontend URL. The application uses JSON and URL-encoded body parsers.
 * It mounts the authentication and API routers, allowing for a clean separation of
 * concerns.
 * -----------------------------------------------------------
 */
// Import types and the global declaration file
import './types/types';

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/authRoutes';
import apiRouter from './routes/apiRoutes';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounts the authentication router at the root of the site
// Mounts the API router under the '/api' prefix
app.use('/api', authRouter);
app.use('/api', apiRouter);

// Exports the app so that vite-plugin-node can serve it
export { app };
