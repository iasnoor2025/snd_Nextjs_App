import { config } from 'dotenv';
import { resolve } from 'path';
import { SettingsService } from '../src/lib/services/settings-service';

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function initialize() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL environment variable is not set');
      console.error('Please ensure your .env.local or .env file contains DATABASE_URL');
      process.exit(1);
    }

    console.log('Initializing default settings...');
    await SettingsService.initializeDefaults();
    console.log('Default settings initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing settings:', error);
    process.exit(1);
  }
}

initialize();

