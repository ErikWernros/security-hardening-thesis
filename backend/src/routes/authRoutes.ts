/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: authRoutes.ts
 * Tools: authController.js, devAuth.js
 * Description:
 * This file contains the authentication routes for the application.
 * It includes routes for both development and production environments.
 * In development, it uses a mock authentication flow, while in production,
 * it integrates with Azure AD for user authentication.
 * It contains conditional logic (if (process.env.NODE_ENV === 'development')) to decide
 * whether to use Azure (production) or development login routes.
 * -----------------------------------------------------------
 */
import { Router } from 'express';
import * as authController from '../controllers/authController';
import devAuthRouter from './devAuth';

// Create a new instance of Router
const authRouter = Router();

// --- Authentication Routes (conditional logic) ---

if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Development mode authentication routes enabled.');

  authRouter.get('/login', (req, res) => res.redirect(process.env.FRONTEND_URL! + '/login'));
  authRouter.use('/dev/auth', devAuthRouter);
} else {
  console.log('🔵 Authentication routes in Production mode enabled.');

  authRouter.get('/login', authController.loginWithAzure);
  authRouter.get('/auth/callback', authController.handleAzureCallback);
}

// The logout route is common for both modes
authRouter.get('/logout', authController.logout);

export default authRouter;
