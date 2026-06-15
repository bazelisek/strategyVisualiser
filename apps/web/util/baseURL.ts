// Build the frontend API base URL. Backend calls should go through Next route
// handlers so authentication and per-user checks happen before proxying.
export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Construct from hostname and port
  const protocol = process.env.NEXT_PUBLIC_API_PROTOCOL || 'http';
  const host = process.env.NEXT_PUBLIC_API_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_API_PORT || process.env.PORT || 3000;
  
  return `${protocol}://${host}:${port}`;
};
