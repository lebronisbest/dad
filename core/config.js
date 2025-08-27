export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  API_PORT: Number(process.env.API_PORT ?? process.env.PORT ?? 3001),
  BASE_URL: process.env.HTTP_BASE_URL ?? `http://localhost:${process.env.API_PORT ?? process.env.PORT ?? 3001}`,
};
