import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Lazy-loaded translation resources to reduce bundle size
const resources = {
  en: {},
  ar: {},
};

// Dynamically import translations when needed
const loadTranslations = async (language: string, namespace: string) => {
  try {
    const translation = await import(`@/dictionaries/${language}/${namespace}.json`);
    
    if (!resources[language as keyof typeof resources]) {
      resources[language as keyof typeof resources] = {};
    }
    
    resources[language as keyof typeof resources][namespace] = translation.default;
    
    // Add resource to i18n
    i18n.addResourceBundle(language, namespace, translation.default, true, true);
    
    return translation.default;
  } catch (error) {
    console.warn(`Failed to load translation: ${language}/${namespace}`, error);
    return {};
  }
};

// Load essential translations immediately (only common and auth)
const loadEssentialTranslations = async () => {
  const essentialNamespaces = ['common', 'auth'];
  const languages = ['en', 'ar'];
  
  for (const lang of languages) {
    for (const ns of essentialNamespaces) {
      await loadTranslations(lang, ns);
    }
  }
};

// Initialize i18next with minimal resources
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources,
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      defaultNS: 'common',
      ns: ['common', 'auth'], // Start with minimal namespaces
      react: {
        useSuspense: false,
      },
    });

  // Load essential translations
  loadEssentialTranslations();
}

// Function to load translations on demand
export const loadNamespace = async (namespace: string, language?: string) => {
  const currentLang = language || i18n.language || 'en';
  
  if (i18n.hasResourceBundle(currentLang, namespace)) {
    return; // Already loaded
  }
  
  await loadTranslations(currentLang, namespace);
};

// Load multiple namespaces
export const loadNamespaces = async (namespaces: string[], language?: string) => {
  const currentLang = language || i18n.language || 'en';
  
  const promises = namespaces.map(ns => {
    if (!i18n.hasResourceBundle(currentLang, ns)) {
      return loadTranslations(currentLang, ns);
    }
    return Promise.resolve();
  });
  
  await Promise.all(promises);
};

export default i18n;
