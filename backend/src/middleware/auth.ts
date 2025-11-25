/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: auth.ts
 * Tools: JWT, express
 * Description:
 * This file contains the authentication middleware for protecting routes.
 * It checks if the user is authenticated and has the required role to access the route.
 * The middleware uses JWT for authentication and ensures type safety with TypeScript.
 * It also includes a type guard to validate the user role.
 * The middleware is used in the API routes to secure access to protected resources.
 * It acts as the API's "gatekeeper." It exports the protectedRoute function, which
 * verifies the Authorization: Bearer <token> in the headers, validates the JWT, and
 * checks if the user's role is in the list of allowed roles for that route.
 * -----------------------------------------------------------
 */
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// 1. Define the exact shape of our JWT payload.
//    Extend JwtPayload to include standard fields (iat, exp, etc.).
interface CustomJWTPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
  displayName: string | null;
}

export const protectedRoute = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          message: 'No token provided.',
          code: 'MISSING_TOKEN', // ✅ NYTT: Error code
        });
      }

      // ✅ NYTT: Environment variable validation
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        return res.status(500).json({
          message: 'Server configuration error',
          code: 'SERVER_CONFIG_ERROR',
        });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          // ✅ FÖRBÄTTRAD: Specific error handling
          if (err.name === 'TokenExpiredError') {
            return res.status(403).json({
              message: 'Token has expired.',
              code: 'TOKEN_EXPIRED',
            });
          }
          if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({
              message: 'Invalid token.',
              code: 'INVALID_TOKEN',
            });
          }
          // Generic JWT error
          return res.status(403).json({
            message: 'Token verification failed.',
            code: 'TOKEN_VERIFICATION_FAILED',
          });
        }

        // 2. We perform a type check (Type Guard).
        //    We make sure the decoded payload is an object and not a string.
        if (typeof decoded !== 'object' || decoded === null) {
          return res.status(403).json({
            message: 'Invalid token format.',
            code: 'INVALID_TOKEN_FORMAT', // ✅ NYTT: Error code
          });
        }

        // 3. We perform a type assertion.
        //    We tell TypeScript: "Trust me, I know that 'decoded' has this shape."
        const userPayload = decoded as CustomJWTPayload;

        // 'userPayload.role' is now a type-safe string.
        if (!roles.includes(userPayload.role)) {
          return res.status(403).json({
            message: 'Insufficient permissions.',
            code: 'INSUFFICIENT_PERMISSIONS', // ✅ NYTT: Error code
          });
        }

        // The assignment is safe because 'userPayload' has the same shape as 'req.user'.
        req.user = userPayload;

        next();
      });
    } catch (error) {
      // ✅ NYTT: Catch unexpected errors outside JWT verification
      console.error('Unexpected authentication error:', error);
      return res.status(500).json({
        message: 'Internal authentication error',
        code: 'AUTH_INTERNAL_ERROR',
      });
    }
  };
};
