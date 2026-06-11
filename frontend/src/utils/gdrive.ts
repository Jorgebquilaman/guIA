export function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?docs\.google\.com\/(?:document|spreadsheets|presentation|file)\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function getGoogleDriveEmbedUrl(url: string): string | null {
  const id = extractGoogleDriveId(url)
  return id ? `https://drive.google.com/file/d/${id}/preview` : null
}

export function getGoogleDriveViewUrl(url: string): string | null {
  const id = extractGoogleDriveId(url)
  return id ? `https://drive.google.com/file/d/${id}/view` : null
}

export function isGoogleDriveUrl(url: string): boolean {
  return extractGoogleDriveId(url) !== null
}
