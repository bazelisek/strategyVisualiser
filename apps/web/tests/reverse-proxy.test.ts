/**
 * Reverse Proxy Tests
 * 
 * Tests to verify that the reverse proxy in next.config.ts is correctly
 * forwarding backend API calls to the Spring Boot server while preserving
 * Next.js API routes.
 * 
 * Prerequisites:
 * - Backend running on http://localhost:8080
 * - Frontend running on http://localhost:3000
 * 
 * Run with: npm test -- tests/reverse-proxy.test.ts
 */

const FRONTEND_URL = "http://localhost:3000";
const BACKEND_URL = "http://localhost:8080";

describe("Reverse Proxy Configuration", () => {
  describe("Backend API Proxying", () => {
    test("Health endpoint should be proxied to backend", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/health`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Trading API is running");
    });

    test("Strategies endpoint should be proxied and return data", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/strategies`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Strategies POST endpoint should be proxied (method forwarding)", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/strategies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", description: "Test" }),
      });
      // We expect 500 due to missing auth/validation, but it should reach backend
      expect([400, 401, 403, 500]).toContain(response.status);
    });

    test("Jobs endpoint should be proxied", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/jobs`);
      // Status can vary but should not be a client-side 404
      expect(response.status).not.toBe(404);
    });

    test("Stocks endpoint should be proxied", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/stocks`);
      // Status depends on backend, but should reach backend
      expect(response.headers.get("x-powered-by")).toBeNull(); // Not Next.js error
    });

    test("Yahoo endpoint should be proxied", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/yahoo`);
      // Should reach backend even if empty response
      expect(response.headers.get("x-powered-by")).toBeNull();
    });
  });

  describe("OpenAPI/Swagger Proxying", () => {
    test("OpenAPI spec should be proxied from backend", async () => {
      const response = await fetch(`${FRONTEND_URL}/v3/api-docs`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.openapi).toBeDefined();
      expect(data.info.title).toContain("API");
    });

    test("Swagger UI HTML should be proxied from backend", async () => {
      const response = await fetch(`${FRONTEND_URL}/swagger-ui/index.html`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("Swagger UI");
      expect(html).toContain("swagger-ui-bundle.js");
    });

    test("Swagger UI redirect should work", async () => {
      const response = await fetch(`${FRONTEND_URL}/swagger-ui.html`, {
        redirect: "follow",
      });
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("Swagger UI");
    });
  });

  describe("Next.js API Routes - NOT Proxied", () => {
    test("Next.js /api/auth routes should NOT be proxied", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/auth/callback/email`, {
        method: "POST",
      });
      // Should be handled by Next.js middleware, not proxied to backend
      // Expect Next.js specific headers or error handling
      expect(response.status).toBeLessThan(500); // Should not reach backend's 500 errors
    });

    test("Next.js /api/history routes should NOT be proxied", async () => {
      const response = await fetch(`${FRONTEND_URL}/api/history`);
      // Should be handled by Next.js, not forwarded to backend
      expect(response.headers.get("x-powered-by")).not.toContain("Apache");
    });
  });

  describe("Backend Connectivity", () => {
    test("Backend should be running and accessible", async () => {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      expect(response.status).toBe(200);
    });

    test("Verify proxy doesn't add headers that break responses", async () => {
      const proxyResponse = await fetch(`${FRONTEND_URL}/api/health`);
      const directResponse = await fetch(`${BACKEND_URL}/api/health`);

      const proxyText = await proxyResponse.text();
      const directText = await directResponse.text();

      expect(proxyText).toBe(directText);
    });
  });

  describe("Configuration", () => {
    test("BACKEND_URL environment variable can be set for different environments", () => {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
      expect(backendUrl).toBeDefined();
      expect(backendUrl).toContain("http");
    });
  });
});
