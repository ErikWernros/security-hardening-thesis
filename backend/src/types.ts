/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: types.ts
 * Description:
 * This file contains TypeScript type definitions for the application.
 * It defines the structure of the user payload and extends the Express Request
 * interface to include a user property. This allows for type safety when accessing
 * user information in the request object throughout the application.
 * The user payload includes fields such as id, email, role, and displayName.
 * This setup is crucial for ensuring that the application can securely handle user
 * authentication and authorization.
 * The types are designed to work seamlessly with the authentication middleware and
 * controllers, providing a clear contract for user data.
 * Uses declaration merging to add the optional user?: UserPayload property to the
 * Express global Request type.
 * -----------------------------------------------------------
 */

// 1. Declare the structure of the user.
export interface UserPayload {
  id: number;
  email: string;
  role: string;
  displayName?: string | null;
}

// 2. We use "declaration merging" to add the 'user' property
//    to the global Express Request type.
declare global {
  namespace Express {
    export interface Request {
      user?: UserPayload; // Made optional so unprotected routes don't throw errors.
      file?: Express.Multer.File;
      validatedBody?: unknown; // For Zod validated body
      validatedQuery?: unknown; // For Zod validated query
      validatedParams?: unknown; // For Zod validated params
    }
  }
}
