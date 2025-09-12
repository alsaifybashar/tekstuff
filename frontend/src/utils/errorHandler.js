// src/utils/errorHandler.js

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error handler for API responses
 */
export function handleAPIError(error) {
  // Network error
  if (!error.response) {
    return {
      message: 'Nätverksfel. Kontrollera din internetanslutning.',
      type: 'NETWORK_ERROR',
      retry: true
    };
  }

  const { status, data } = error.response;

  // Handle specific status codes
  switch (status) {
    case 400:
      return {
        message: data?.message || 'Ogiltig begäran. Kontrollera inmatningen.',
        type: 'VALIDATION_ERROR',
        errors: data?.errors || []
      };

    case 401:
      return {
        message: 'Du måste logga in för att fortsätta.',
        type: 'AUTHENTICATION_ERROR',
        redirect: '/login'
      };

    case 403:
      return {
        message: 'Du har inte behörighet att utföra denna åtgärd.',
        type: 'AUTHORIZATION_ERROR'
      };

    case 404:
      return {
        message: 'Resursen kunde inte hittas.',
        type: 'NOT_FOUND'
      };

    case 429:
      return {
        message: 'För många förfrågningar. Vänta en stund och försök igen.',
        type: 'RATE_LIMIT',
        retryAfter: data?.retryAfter || 60
      };

    case 500:
    case 502:
    case 503:
      return {
        message: 'Serverfel. Vi arbetar på att lösa problemet.',
        type: 'SERVER_ERROR',
        retry: true
      };

    default:
      return {
        message: data?.message || 'Ett oväntat fel uppstod.',
        type: 'UNKNOWN_ERROR'
      };
  }
}

/**
 * Retry logic for failed requests
 */
export async function retryRequest(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}

/**
 * Global error boundary error handler
 */
export function logError(error, errorInfo = {}) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorData);
  }

  // Send to error tracking service (e.g., Sentry)
  if (window.Sentry && import.meta.env.PROD) {
    window.Sentry.captureException(error, {
      extra: errorData
    });
  }

  return errorData;
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Kunde inte ansluta till servern. Kontrollera din internetanslutning.',
  TIMEOUT: 'Förfrågan tog för lång tid. Försök igen.',
  VALIDATION: 'Kontrollera att alla fält är korrekt ifyllda.',
  AUTH: 'Din session har gått ut. Logga in igen.',
  PERMISSION: 'Du har inte behörighet att visa denna sida.',
  NOT_FOUND: 'Sidan kunde inte hittas.',
  SERVER: 'Ett serverfel uppstod. Försök igen senare.',
  GENERIC: 'Något gick fel. Försök igen.'
};