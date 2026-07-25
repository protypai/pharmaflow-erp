// Centralized Cloud Backend API configuration
export const API_BASE_URL = (import.meta.env.VITE_CLOUD_API_URL || 'http://localhost:5000').replace(/\/$/, '');
