import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('   Please copy .env.example to .env and configure your Supabase credentials');
  
  // In development, we can continue with dummy values for configuration setup
  if (process.env.NODE_ENV !== 'production') {
    console.warn('   Running in development mode with placeholder values');
  } else {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
}

// Fallback values for development
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'development-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'development-service-key';

// Create Supabase client for general operations
export const supabase = missingEnvVars.length === 0 ? createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
) : null;

// Create Supabase admin client for service operations
export const supabaseAdmin = missingEnvVars.length === 0 ? createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
) : null;

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Database client not initialized - missing environment variables');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Connection pool configuration
export const dbConfig = {
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

export default { supabase, supabaseAdmin, checkDatabaseConnection, dbConfig };