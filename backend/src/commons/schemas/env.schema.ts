export const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'JWT_SECRET',
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'API_URL',
    'CLIENT_API_URL',
    'OAUTH_GOOGLE_CLIENT_ID',
    'OAUTH_GOOGLE_CLIENT_SECRET',
    'GEMINI_API_KEY',
  ],
  properties: {
    PORT: {
      type: 'number',
      default: 3000,
    },
    JWT_SECRET: {
      type: 'string',
    },
    DATABASE_URL: {
      type: 'string',
    },
    SMTP_HOST: {
      type: 'string',
    },
    SMTP_PORT: {
      type: 'number',
    },
    SMTP_USER: {
      type: 'string',
    },
    SMTP_PASSWORD: {
      type: 'string',
    },
    API_URL: {
      type: 'string',
    },
    CLIENT_API_URL: {
      type: 'string',
    },
    OAUTH_GOOGLE_CLIENT_ID: {
      type: 'string',
    },
    OAUTH_GOOGLE_CLIENT_SECRET: {
      type: 'string',
    },
    GEMINI_API_KEY: {
      type: 'string',
    },
    GOOGLE_CLOUD_PROJECT: {
      type: 'string',
    },
    GOOGLE_CLOUD_LOCATION: {
      type: 'string',
    },
    GOOGLE_GENAI_USE_VERTEXAI: {
      type: 'string',
    },
  },
};
