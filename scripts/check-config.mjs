import { existsSync } from 'node:fs';
import { loadProjectEnv } from '@expo/env';

const keys = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID'];

if (!existsSync('.env')) {
  console.error('Missing .env. Copy .env.example to .env and fill in the Firebase web configuration.');
  process.exitCode = 1;
} else {
  const { files = [] } = loadProjectEnv(process.cwd(), { force: true, silent: true });
  const missing = keys.filter(key => {
    const value = process.env[`EXPO_PUBLIC_FIREBASE_${key}`];
    return !value?.trim() || value.startsWith('replace-me');
  });

  if (missing.length) {
    console.error('Incomplete Firebase config after Expo environment loading:', missing.join(', '));
    process.exitCode = 1;
  } else {
    console.log(`Expo resolved all Firebase environment keys from ${files.join(', ') || '.env'}.`);
    try {
      const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({
            identifier: 'bottleflow-config-check@example.invalid',
            continueUri: 'http://localhost',
          }),
        },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error?.message || `Firebase Authentication returned HTTP ${response.status}`);
      }

      console.log('Firebase Authentication accepted the API key and project configuration.');
    } catch (error) {
      console.error('Firebase live configuration check failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
