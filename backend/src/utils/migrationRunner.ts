import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from '../config/database';

interface Migration {
  id: string;
  filename: string;
  description: string;
}

export class MigrationRunner {
  private migrationsPath: string;

  constructor(migrationsPath: string = join(__dirname, '../migrations')) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Check if database schema exists by testing a simple query
   */
  async checkSchemaExists(): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        return false;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      // If no error, schema exists
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of available migration files
   */
  private getMigrationFiles(): Migration[] {
    try {
      const files = readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(filename => {
        const id = filename.replace('.sql', '');
        const description = `Migration: ${filename}`;
        return { id, filename, description };
      });
    } catch (error) {
      console.log('No migration files found or migrations directory does not exist');
      return [];
    }
  }

  /**
   * Initialize database schema using Supabase CLI
   * This is a simplified approach that relies on Supabase's built-in migration system
   */
  async initializeSchema(): Promise<void> {
    console.log('🔄 Initializing database schema...');
    console.log('📋 For Supabase projects, please run the following commands:');
    console.log('   1. supabase db reset (to reset the database)');
    console.log('   2. supabase db push (to apply migrations)');
    console.log('   3. supabase gen types typescript --local > src/types/database.types.ts');
    console.log('');
    console.log('💡 The schema is defined in the migration file: backend/src/migrations/001_initial_schema.sql');
    console.log('   Copy this content to your Supabase SQL editor or migration files.');
  }

  /**
   * Verify database connection and basic schema
   */
  async verifyConnection(): Promise<boolean> {
    try {
      console.log('🔍 Verifying database connection...');
      
      if (!supabaseAdmin) {
        console.error('❌ Database client not initialized - missing environment variables');
        return false;
      }
      
      // Test basic connection
      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database verification failed:', error);
      return false;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    connected: boolean;
    schemaExists: boolean;
    availableMigrations: string[];
  }> {
    const connected = await this.verifyConnection();
    const schemaExists = await this.checkSchemaExists();
    const availableMigrations = this.getMigrationFiles().map(m => m.filename);

    return {
      connected,
      schemaExists,
      availableMigrations
    };
  }
}

// Create a default instance
export const migrationRunner = new MigrationRunner();

// CLI runner function
export async function runMigrationsFromCLI(): Promise<void> {
  try {
    const status = await migrationRunner.getMigrationStatus();
    
    console.log('📊 Migration Status:');
    console.log(`   Database Connected: ${status.connected ? '✅' : '❌'}`);
    console.log(`   Schema Exists: ${status.schemaExists ? '✅' : '❌'}`);
    console.log(`   Available Migrations: ${status.availableMigrations.length}`);
    
    if (!status.schemaExists) {
      await migrationRunner.initializeSchema();
    } else {
      console.log('✅ Database schema already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration check failed:', error);
    process.exit(1);
  }
}