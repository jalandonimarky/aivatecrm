// This file provides minimal type declarations for Deno-specific globals and remote modules
// to help local TypeScript environments. It does not affect the deployed function's runtime.

// Declare the 'serve' function from the Deno standard library HTTP server module.
// This helps TypeScript understand the function signature when imported from the URL.
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): Promise<void>;
}

// Declare the global Deno namespace, specifically Deno.env,
// to resolve 'Cannot find name 'Deno'' or 'Cannot find property 'env' on type 'typeof Deno'' errors.
// This is a simplified declaration for common usage.
declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}