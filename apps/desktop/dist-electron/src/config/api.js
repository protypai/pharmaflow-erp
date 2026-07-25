"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_BASE_URL = void 0;
// Centralized Cloud Backend API configuration
exports.API_BASE_URL = (import.meta.env.VITE_CLOUD_API_URL || 'http://168.144.179.128').replace(/\/$/, '');
