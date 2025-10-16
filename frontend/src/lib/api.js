// Centralized API helpers

// Resolve backend base URL with safe fallbacks:
// 1) Use explicit env var if provided (recommended for deployments)
// 2) In local dev, default to FastAPI on 8000
// 3) In production (no env var), fall back to the Render backend service URL
//    Update the fallback domain below if your Render service name changes
const fallbackProdUrl = 'https://crm-backend-1e1e.onrender.com';
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.host);

export const API =
  process.env.REACT_APP_BACKEND_URL ||
  (isLocalhost ? 'http://localhost:8000' : fallbackProdUrl);

