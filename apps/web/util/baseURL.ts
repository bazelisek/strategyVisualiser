// Build BASE_URL from environment variables or defaults
// Priority: INTERNAL_API_URL > NEXT_PUBLIC_API_URL > compose from host/port
export const getBaseUrl = () => {
  // Explicit internal API URL takes priority
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  
  // Public API URL for different environments
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Construct from hostname and port
  const protocol = process.env.NEXT_PUBLIC_API_PROTOCOL || 'http';
  const host = process.env.NEXT_PUBLIC_API_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_API_PORT || process.env.PORT || 3000;
  
  return `${protocol}://${host}:${port}`;
};