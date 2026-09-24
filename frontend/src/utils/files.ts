import { useAuthStore } from '../store/authStore'

// Agrega el access token como query param a URLs de archivos que se cargan
// con src=/href= (iframe, img, a[download]), donde no se puede enviar el
// header Authorization. El backend solo lo acepta en endpoints de archivos
// de documentos (download, preview, thumbnail).
export function withFileToken(url: string): string {
  const token = useAuthStore.getState().accessToken
  if (!token) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}access_token=${encodeURIComponent(token)}`
}
