export const envSchema = {
  type: 'object',
  required: ['PORT', 'JWT_SECRET'],
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
  },
};
