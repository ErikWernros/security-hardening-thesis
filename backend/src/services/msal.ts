/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: msal.ts
 * Tools: msal-node, dotenv
 * Description:
 * Encapsulates all interaction with the Microsoft library (@azure/msal-node).
 * This file contains the MSAL client configuration for Azure AD authentication.
 * It initializes the MSAL client only in production environments, ensuring that
 * the application can securely authenticate users against Azure Active Directory.
 * The configuration is loaded from environment variables using dotenv. Conditional
 * initialization has been implemented. The MSAL client is only created if NODE_ENV is
 * not development.
 * The MSAL client is exported for use in the authentication controller.
 * This setup allows for a clean separation of concerns, keeping the authentication logic
 * modular and maintainable.
 * -----------------------------------------------------------
 */
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

// 1. Declare the msalClient variable but do not initialize it yet.
//    We give it an explicit type so TypeScript is satisfied.
let msalClient: ConfidentialClientApplication;

// 2. Only initialize the client if we are NOT in development AND we have a Client ID.
//    This is a robust check.
if (process.env.NODE_ENV !== 'development' && process.env.AZURE_AD_CLIENT_ID) {
  // The configuration is only created if necessary.
  const msalConfig: Configuration = {
    auth: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    },
  };

  // 3. Now, we safely create the client instance.
  msalClient = new ConfidentialClientApplication(msalConfig);
}

// 4. Export the variable. In development, it will be 'undefined', which is safe
//    because it will never be used. In production, it will be the client instance.
export { msalClient };
