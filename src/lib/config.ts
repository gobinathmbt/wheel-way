// config.ts

type ServerEnv = "PROD" | "TEST" | "LOCAL";

const server: ServerEnv = "LOCAL";

// Frontend URL map
const FRONTEND_URLS: Record<ServerEnv, string> = {
  PROD: "https://dev.apperp.io",
  TEST: "http://dev.apperp.io",
  LOCAL: "http://localhost:8080",
};

// Backend URL map
const BACKEND_URLS: Record<ServerEnv, string> = {
  PROD: "https://dev-backend.apperp.io",
  TEST: "https://dev-backend.apperp.io",
  LOCAL: "http://localhost:5000",
};

const URL: string = FRONTEND_URLS[server];
const BASE_URL: string = BACKEND_URLS[server];

export { BASE_URL, URL };
