import { SettingsService } from './services/settings-service';

/**
 * Get public settings (can be used in server components)
 * This function doesn't require authentication
 */
export async function getPublicSettings(): Promise<Record<string, string | null>> {
  try {
    return await SettingsService.getPublicSettings();
  } catch (error) {
    console.error('Error fetching public settings:', error);
    // Return defaults if there's an error
    return {
      'company.name': 'SND Rental',
      'company.logo': '/snd-logo.png',
      'app.name': 'SND Rental',
    };
  }
}

