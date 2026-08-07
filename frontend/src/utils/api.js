const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Utility for unified API calls with automatic JSON parsing, timeout, and graceful fallback handling.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        message: errorData.message || `Server error (${response.status})`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`[API Warning] Connection to ${url} failed. Using graceful fallback.`, error);
    return {
      success: false,
      isOffline: true,
      message: 'Backend server unavailable. Operating in local mode.'
    };
  }
}
