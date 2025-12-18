import { useState, useEffect } from 'react';

interface Settings {
  [key: string]: string | null;
}

let settingsCache: Settings | null = null;
let settingsPromise: Promise<Settings> | null = null;

// Function to clear cache (useful when settings are updated)
export function clearSettingsCache() {
  settingsCache = null;
  settingsPromise = null;
}

export function useSettings(keys?: string[]) {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // Use cache if available
        if (settingsCache && !keys) {
          setSettings(settingsCache);
          setLoading(false);
          return;
        }

        // Prevent duplicate requests
        if (!settingsPromise) {
          settingsPromise = fetch('/api/settings?public=true')
            .then(res => res.json())
            .then(data => {
              const settingsObj: Settings = {};
              if (data.settings) {
                Object.entries(data.settings).forEach(([key, value]) => {
                  settingsObj[key] = value as string | null;
                });
              }
              settingsCache = settingsObj;
              return settingsObj;
            })
            .finally(() => {
              settingsPromise = null;
            });
        }

        const allSettings = await settingsPromise;
        
        if (keys) {
          const filtered: Settings = {};
          keys.forEach(key => {
            filtered[key] = allSettings[key] || null;
          });
          setSettings(filtered);
        } else {
          setSettings(allSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [keys?.join(',')]);

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  return { settings, loading, getSetting };
}

