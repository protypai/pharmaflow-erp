// Centralized Cloud Backend API configuration
// Reads the API base URL from Vite env at build/runtime. Never hardcode a
// production host here — configure VITE_API_BASE_URL (or legacy VITE_CLOUD_API_URL)
// via the environment. Falls back to a local dev backend.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_CLOUD_API_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');
