/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: devAuth.ts
 * Tools: authController.js, Router
 * Description:
 * This file contains the development authentication routes for the application.
 * This is a "mini-router" used only by authRoutes.ts in development mode.
 * It includes a route for handling the callback from the development authentication
 * flow.
 * The routes are designed to work in a development environment, allowing for easy
 * testing and integration with the authentication controller.
 * The routes are used to simulate authentication behavior without relying on external
 * services.
 * This is particularly useful for local development and testing purposes.
 * -----------------------------------------------------------
 */
import { Router } from 'express';
import { handleDevCallback } from '../controllers/authController';

const devAuthRouter: Router = Router();
devAuthRouter.post('/callback', handleDevCallback);

export default devAuthRouter;
