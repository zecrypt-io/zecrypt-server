# Zecrypt Frontend Web

This is the web frontend for Zecrypt, a secure password management solution.

## Translation Management

The application supports multiple languages through translation files located in the `messages` directory. Each language has its own directory (e.g., `en`, `fr`, `de`) containing a `common.json` file with all the translation keys.

### Adding New Translation Keys

When adding new UI elements that require translation:

1. Add the translation key to the English file first: `messages/en/common.json`
2. Run the translation update script to propagate the new keys to all other language files:

```bash
# Using npm script
npm run update-translations

# Or directly using the Node.js script
node update-translations.js

# Or using the shell script
./update-translations.sh
```

The script will add any missing keys to all language files, preserving existing translations and only adding English placeholders for new keys.

### Supported Languages

The application currently supports the following languages:
- English (en)
- French (fr)
- German (de)
- Spanish (es)
- Italian (it)
- Japanese (ja)
- Korean (ko)
- Chinese (zh-CN, zh-Hant)
- And many more (see the `messages` directory for the complete list)

### Translation Usage

In your React components, use the `useTranslations` hook from 'next-intl' to access translations:

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('user_settings');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
``` 