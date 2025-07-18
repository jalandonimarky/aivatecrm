// This file provides minimal type declarations for Deno-specific globals and remote modules
// to help local TypeScript environments. It does not affect the deployed function's runtime.

// Declare the 'serve' function from the Deno standard library HTTP server module.
// This helps TypeScript understand the function signature when imported from the URL.
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): Promise<void>;
}

// Declare the Supabase client from esm.sh
declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  import { SupabaseClient } from '@supabase/supabase-js';
  export function createClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database,
    PublicSchema extends {
      Tables: { [K in string]: { Row: any } };
      Functions: { [K in string]: { Args: any; Returns: any } };
    } = SchemaName extends keyof Database
      ? Database[SchemaName] extends {
          Tables: { [K in string]: { Row: any } };
          Functions: { [K in string]: { Args: any; Returns: any } };
        }
        ? Database[SchemaName]
        : never
      : never,
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      db?: { schema?: SchemaName };
      auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
        detectSessionInUrl?: boolean;
        storage?: Storage;
        storageKey?: string;
        flowType?: 'pkce' | 'implicit';
        debug?: boolean;
      };
      global?: {
        headers?: Record<string, string>;
        fetch?: typeof fetch;
        /**
         * A custom schema.api.
         *
         * @experimental
         */
        url?: string;
      };
    }
  ): SupabaseClient<Database, SchemaName, PublicSchema>;
}

// Declare the global Deno namespace, specifically Deno.env,
// to resolve 'Cannot find name 'Deno'' or 'Cannot find property 'env' on type 'typeof Deno'' errors.
// This is a simplified declaration for common usage.
declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}