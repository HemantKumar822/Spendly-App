/**
 * Environment configuration for Spendly app
 * Handles environment variables and configuration settings
 */

// Environment variables (must be prefixed with EXPO_PUBLIC_ for React Native)
const ENV = {
  OPENROUTER_API_KEY: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free',
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Spendly',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
};

// OpenRouter API Configuration
export const OPENROUTER_CONFIG = {
  baseURL: 'https://openrouter.ai/api/v1',
  model: ENV.OPENROUTER_MODEL,
  apiKey: ENV.OPENROUTER_API_KEY,
  headers: {
    'Authorization': `Bearer ${ENV.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://spendly-app.com',
    'X-Title': 'Spendly - Student Expense Tracker',
  }
};

// App Configuration
export const APP_CONFIG = {
  name: ENV.APP_NAME,
  version: ENV.APP_VERSION,
  devMode: ENV.DEV_MODE,
  
  // AI Service Settings
  ai: {
    enabled: Boolean(ENV.OPENROUTER_API_KEY),
    maxRetries: 3,
    timeoutMs: 10000,
    fallbackToRules: true,
  },
  
  // Storage Settings
  storage: {
    prefix: 'spendly_',
    version: '1.0',
  },
  
  // UI Settings
  ui: {
    animationDuration: 300,
    refreshThreshold: 100,
  }
};

// Debug helper
export const logConfig = () => {
  if (ENV.DEV_MODE) {
    console.log('🔧 Spendly Configuration:');
    console.log('- AI Service:', APP_CONFIG.ai.enabled ? '✅ Enabled' : '❌ Disabled');
    console.log('- Model:', OPENROUTER_CONFIG.model);
    console.log('- API Key:', ENV.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing');
  }
};

export default { ENV, OPENROUTER_CONFIG, APP_CONFIG };