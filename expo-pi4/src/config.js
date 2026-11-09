// Endereços vêm do .env (EXPO_PUBLIC_*) ou do eas.json no build do APK.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://placebrokers-api.onrender.com").replace(/\/+$/, "");
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || "https://placebrokers-frontend.vercel.app").replace(/\/+$/, "");