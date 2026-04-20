export function logRequest(method, url) {
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);
}

export function logError(url, err) {
  console.error(`[${new Date().toISOString()}] ERROR ${url}:`, err.message);
}
