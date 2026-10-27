export function createBearerHeaders(accessToken, headers = {}) {
  return {
    ...headers,
    Authorization: `Bearer ${accessToken}`,
  }
}
