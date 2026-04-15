# Reverse Proxy Configuration

This document describes the reverse proxy setup that forwards backend API calls through the Next.js frontend during development.

## Overview

The Next.js development server acts as a reverse proxy, forwarding certain API calls to the backend Spring Boot server running on `http://localhost:8080`. This allows frontend development without CORS issues and enables access to Swagger UI and OpenAPI documentation.

## Configuration

The reverse proxy is configured in `next.config.ts` using Next.js's `rewrites` feature. Here's what gets proxied:

### Backend API Endpoints

All these endpoints are forwarded to the backend server:

| Frontend URL | Backend URL | Purpose |
|--------------|-------------|---------|
| `/api/health` | `http://localhost:8080/api/health` | Service health check |
| `/api/jobs/*` | `http://localhost:8080/api/jobs/*` | Job management API |
| `/api/stocks/*` | `http://localhost:8080/api/stocks/*` | Stock data API |
| `/api/strategies/*` | `http://localhost:8080/api/strategies/*` | Trading strategies API |
| `/api/yahoo/*` | `http://localhost:8080/api/yahoo/*` | Yahoo Finance data API |

### Documentation & Swagger

These endpoints are proxied for OpenAPI documentation:

| Frontend URL | Backend URL | Purpose |
|--------------|-------------|---------|
| `/v3/api-docs/*` | `http://localhost:8080/v3/api-docs/*` | OpenAPI specification |
| `/swagger-ui/*` | `http://localhost:8080/swagger-ui/*` | Swagger UI assets |
| `/swagger-ui.html` | `http://localhost:8080/swagger-ui.html` | Swagger UI redirect |

### Next.js API Routes (NOT Proxied)

These routes are handled by Next.js itself:

- `/api/auth/*` - Authentication endpoints (handled by better-auth)
- `/api/history/*` - History endpoints (Next.js server actions)

## Environment Configuration

### Development (Default)

```bash
# Uses default backend URL
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

### Development with Remote Backend

```bash
# Point to a different backend server
BACKEND_URL=http://backend-server:8080 npm run dev
```

### Production Deployment

For production, ensure the `BACKEND_URL` environment variable is set to your production backend:

```bash
# Docker or deployment environment
BACKEND_URL=https://api.example.com npm run build
npm start
```

If not set, it defaults to `http://localhost:8080` (suitable for local deployments only).

## How It Works

1. **Request Reception**: When a client makes a request to `http://localhost:3000/api/strategies`, Next.js receives it
2. **Rewrite Match**: The rewrite rules check if the URL matches any proxy patterns
3. **Forwarding**: If matched, the request is forwarded to the backend at `http://localhost:8080/api/strategies`
4. **Response Passthrough**: The backend response is sent back to the client with transparent proxying
5. **Next.js Routes**: If no proxy rule matches (like `/api/auth`), the request is handled by Next.js normally

## CORS Handling

Because requests are proxied through the same origin (`localhost:3000`), CORS is not an issue in development:

- **With Proxy**: Client → `localhost:3000/api/*` → Backend (same origin during proxy)
- **Without Proxy**: Client → `localhost:3000`, Backend → `localhost:8080` (cross-origin, needs CORS)

## Testing the Proxy

### Test Backend Connectivity

```bash
# Should return "Trading API is running!"
curl http://localhost:3000/api/health

# Should return JSON with strategies
curl http://localhost:3000/api/strategies | jq .

# Should return OpenAPI spec
curl http://localhost:3000/v3/api-docs | jq .
```

### Test Next.js Routes Still Work

```bash
# Should be handled by Next.js, not proxied
curl http://localhost:3000/api/auth

# If auth is properly setup, should return valid response
curl http://localhost:3000/api/history
```

### Test Swagger UI

```bash
# Should return Swagger UI HTML
curl http://localhost:3000/swagger-ui/index.html | grep -i "swagger"

# Or open in browser
open http://localhost:3000/swagger-ui/
```

## Troubleshooting

### "Internal Server Error" on API calls

**Cause**: Backend is not running or not accessible

**Solution**:
```bash
# Start the backend
cd apps/backend
./mvnw spring-boot:run -DskipTests
```

### Proxy not forwarding requests

**Cause**: `next.config.ts` not reloaded, or rewrites syntax error

**Solution**:
1. Stop Next.js dev server
2. Verify `next.config.ts` syntax is correct
3. Restart dev server: `npm run dev`

### CORS errors after adding proxy

**Cause**: Backend needs CORS headers when accessed directly (not through proxy)

**Solution**: Backend is already configured for CORS, but ensure when accessing directly, the origin is allowed.

## Architecture Diagram

```
Development Flow:
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ http://localhost:3000/api/strategies
       ▼
┌──────────────────┐
│  Next.js Dev     │
│  Server (3000)   │
└──────┬───────────┘
       │ Rewrite matches /api/strategies
       │ Forwards to backend
       ▼
┌──────────────────┐
│  Spring Boot     │
│  Backend (8080)  │
└──────────────────┘
       │
       │ Returns response
       ▼
┌──────────────────┐
│  Browser         │
│  (receives data) │
└──────────────────┘

Production Flow (if needed):
┌─────────────┐
│   Browser   │ https://example.com/api/strategies
└──────┬──────┘
       ▼
┌──────────────────────┐
│  Next.js Server      │
│  (production build)  │
└──────┬───────────────┘
       │ Rewrite to BACKEND_URL env var
       │ (e.g., https://api.example.com)
       ▼
┌──────────────────────┐
│  Spring Boot Backend  │
│  (api.example.com)   │
└──────────────────────┘
```

## Performance Considerations

- **Latency**: Minimal (same as direct backend calls in production)
- **Memory**: Negligible overhead from Next.js proxy
- **Scalability**: In production, remove the proxy and serve frontend/backend separately from different domains

## See Also

- [Next.js Rewrites Documentation](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites)
- [next.config.ts](./next.config.ts) - Proxy configuration file
- [tests/reverse-proxy.test.ts](./tests/reverse-proxy.test.ts) - Test suite for proxy functionality
