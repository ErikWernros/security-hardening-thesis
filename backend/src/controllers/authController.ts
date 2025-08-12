/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: authController.ts
 * Tools: JWT, Msal, Prisma, Postgres(In Supabase),
 * Description:
 * It's the "brain" of authentication. It contains the business logic for each
 * authentication route: generating the Azure URL, handling the callback, creating/
 * updating users in the database with prisma.user.upsert, and generating JWTs. It
 * keeps
 * the route files clean.
 * This file contains the authentication controller for handling user login,
 * callback from Azure AD, and logout functionality.
 * It includes methods for both development and production environments,
 * ensuring that the application can handle user authentication securely.
 * The controller uses MSAL for Azure AD integration and Prisma for database
 * operations.
 * It also includes type safety checks for user roles.
 * -----------------------------------------------------------
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';
import { msalClient } from '../services/msal';

//const prisma = new PrismaClient();
// Helper function (Type Guard) to validate if a value is an allowed role.
function isValidRole(value: unknown): value is Role {
  // Checks if the received value is included in the Role enum values.
  return Object.values(Role).includes(value as Role);
}

/**
 * Starts the authentication flow with Azure AD by redirecting the user.
 */
export const loginWithAzure = async (req: Request, res: Response, next: NextFunction) => {
  const authCodeUrlParameters = {
    scopes: ['user.read'],
    redirectUri: process.env.REDIRECT_URL!,
  };

  try {
    const response = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(response);
  } catch (error) {
    // Pass the error to Express error handler
    next(error);
  }
};

/**
 * Handles the Azure AD callback after a successful login.
 */
export const handleAzureCallback = async (req: Request, res: Response, next: NextFunction) => {
  const tokenRequest = {
    code: req.query.code as string,
    scopes: ['user.read'],
    redirectUri: process.env.REDIRECT_URL!,
  };

  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    const account = response.account;

    if (!account || !account.username) {
      throw new Error(
        'Could not get account information from Azure. Please check the configuration.'
      );
    }

    const user = await prisma.user.upsert({
      where: { email: account.username },
      update: { displayName: account.name },
      create: {
        email: account.username,
        displayName: account.name,
        // New Azure users are assigned the 'Viewer' role by default.
        role: Role.Viewer,
      },
    });

    // Creates the JWT for our application.
    const appToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        // Keep 'role' as the field name in the JWT for consistency.
        role: user.role,
        displayName: user.displayName,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${appToken}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles the callback from the development login form.
 */
export const handleDevCallback = async (req: Request, res: Response, next: NextFunction) => {
  console.log('--- INICIO: Petición a /dev/auth/callback recibida ---');
  const startTime = Date.now(); // 1. Marca el tiempo de inicio

  // We read 'role' as type 'unknown' to force explicit validation.
  const { email, displayName, role } = req.body as {
    email: string;
    displayName: string;
    role: unknown;
  };

  // Validation of the existence of data.
  if (!email || !role) {
    return res.status(400).json({ message: 'Email and Role are required.' });
  }

  // Specific validation to ensure that the role is one of the enum values.
  if (!isValidRole(role)) {
    const allowedRoles = Object.values(Role).join(', ');
    const providedRole =
      typeof role === 'string' || typeof role === 'number' ? role : 'valor proporcionado';
    return res.status(400).json({
      message: `The role '${providedRole}' is not valid. Allowed roles: ${allowedRoles}`,
    });
  }

  // From here, TypeScript knows that 'role' is of type 'Role'.
  try {
    console.log(`[${Date.now() - startTime}ms] Iniciando prisma.user.upsert...`);

    const user = await prisma.user.upsert({
      where: { email },
      // The assignment is now 100% type-safe.
      update: { displayName, role },
      create: { email, displayName, role },
    });

    console.log(`[${Date.now() - startTime}ms] ...prisma.user.upsert completado.`);
    console.log(`[${Date.now() - startTime}ms] Iniciando jwt.sign...`);

    const appToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role, // We use 'user.role' from the database result.
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    console.log(`[${Date.now() - startTime}ms] ...jwt.sign completado.`);
    console.log('--- FIN: Enviando respuesta JSON ---');

    return res.status(200).json({ token: appToken });
  } catch (error) {
    next(error);
  }
};

/**
 * Logs out the user (in this case, just redirects to the frontend).
 */
export const logout = (req: Request, res: Response) => {
  // The actual invalidation of the token occurs on the client side by deleting it.
  res.redirect(process.env.FRONTEND_URL!);
};
