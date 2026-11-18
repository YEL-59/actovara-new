/**
 * Data-source switch. FRONTEND_FIRST: mocks are ON unless NEXT_PUBLIC_USE_MOCKS=false.
 * Once the Express API exists (Phase B), set NEXT_PUBLIC_USE_MOCKS=false in frontend/.env.local.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * P1? CSV import wizard (Q-008). Hidden behind a feature flag until confirmed in MVP scope.
 */
export const ENABLE_CSV_IMPORT = process.env.NEXT_PUBLIC_ENABLE_CSV_IMPORT === 'true';
