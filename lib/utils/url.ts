export const getAppUrl = () => {
  let url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000';
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  
  // Make sure to remove trailing slash.
  return url.replace(/\/$/, '');
};
