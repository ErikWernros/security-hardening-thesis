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
import helmet from 'helmet'; // <-- LÄGG TILL DENNA IMPORT
import rateLimit from 'express-rate-limit'; // <-- LÄGG TILL DENNA IMPORT
import authRouter from './routes/authRoutes';
import apiRouter from './routes/apiRoutes';
//import aggregateRouter from './routes/aggregateRoutes'; // <-- Ny import

dotenv.config();

const app = express();

// ✅ HELMET - Security headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  })
);

// ✅ RATE LIMITING - DOS protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter); // Apply to all API routes

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounts the authentication router at the root of the site
// Mounts the API router under the '/api' prefix
app.use('/api', authRouter);
app.use('/api', apiRouter);

// Exports the app so that vite-plugin-node can serve it
export { app };
