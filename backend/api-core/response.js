export function success(data, message = 'ok') {
  return { success: true, data, message };
}

export function fail(code, message) {
  return { success: false, error: { code, message } };
}
