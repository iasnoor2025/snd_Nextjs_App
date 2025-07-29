# Internationalization (i18n) Setup Guide

## Overview

The application now supports internationalization with the following features:

- **Multi-language Support**: English (en) and Arabic (ar)
- **RTL Support**: Full right-to-left layout support for Arabic
- **Module-based Translations**: Organized by feature/module
- **Language Detection**: Automatic language detection from browser
- **Language Persistence**: Remembers user's language preference

## Supported Languages

### English (en)
- Default language
- Left-to-right (LTR) layout
- Complete translation coverage

### Arabic (ar)
- Right-to-left (RTL) layout
- Complete translation coverage
- Cultural adaptations

## Translation Structure

```
src/locales/
├── en/
│   ├── common.json      # Common UI elements
│   ├── auth.json        # Authentication
│   ├── equipment.json   # Equipment management
│   ├── employee.json    # Employee management
│   ├── rental.json      # Rental management
│   ├── settings.json    # Settings
│   ├── reporting.json   # Reporting
│   └── analytics.json   # Analytics
└── ar/
    ├── common.json
    ├── auth.json
    ├── equipment.json
    ├── employee.json
    ├── rental.json
    ├── settings.json
    ├── reporting.json
    └── analytics.json
```

## Usage

### In React Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'auth']);
  
  return (
    <div>
      <h1>{t('app.name')}</h1>
      <p>{t('auth.signin.title')}</p>
    </div>
  );
}
```

### Language Switching

The language switcher is available in the header and allows users to:
- Switch between English and Arabic
- Automatically adjust layout direction (LTR/RTL)
- Persist language preference

### RTL Support

When Arabic is selected:
- Document direction changes to RTL
- Layout automatically adjusts
- Text alignment and positioning adapts
- Icons and components mirror appropriately

## Features

### 1. Automatic Language Detection
- Detects user's browser language
- Falls back to English if language not supported
- Remembers user's choice in localStorage

### 2. RTL Layout Support
- Complete RTL support for Arabic
- Automatic layout direction switching
- Proper text alignment and positioning

### 3. Module-based Organization
- Translations organized by feature
- Easy to maintain and extend
- Namespace-based loading

### 4. Type Safety
- TypeScript support for translation keys
- IntelliSense support in development

## Adding New Languages

1. Create a new language folder in `src/locales/`
2. Add translation files for each module
3. Update the language switcher component
4. Test RTL support if needed

## Adding New Translation Keys

1. Add the key to the appropriate JSON file
2. Use the key in your component with `t('key')`
3. Add translations for all supported languages

## Best Practices

1. **Use Namespaces**: Organize translations by feature
2. **Keep Keys Descriptive**: Use clear, hierarchical key names
3. **Test Both Languages**: Always test in both English and Arabic
4. **Consider Context**: Some translations may need context-specific versions
5. **Plan for RTL**: Consider layout implications when adding new UI elements

## Testing

1. Switch between languages using the language switcher
2. Verify RTL layout works correctly for Arabic
3. Check that all text is properly translated
4. Test form validation messages in both languages
5. Verify date and number formatting is appropriate for each locale 
