import type { MediaLink } from '../../types'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com/.test(url)
}

function isDirectAudioFile(url: string): boolean {
  return /\.(mp3|ogg|wav|aac|m4a|flac)$/i.test(url)
}

export default function MediaLinkPlayer({ link }: { link: MediaLink }) {
  const youtubeUrl = getYouTubeEmbedUrl(link.url)
  const gdriveUrl = getGoogleDriveEmbedUrl(link.url)
  const vimeoUrl = getVimeoEmbedUrl(link.url)

  if ((link.type === 'audio' || isDirectAudioFile(link.url)) && !isGoogleDriveUrl(link.url)) {
    return (
      <audio controls className="w-full" src={link.url}>
        Tu navegador no soporta el elemento de audio.
      </audio>
    )
  }

  const embedSrc = youtubeUrl || vimeoUrl || gdriveUrl || link.url

  return (
    <iframe
      src={embedSrc}
      className="h-full w-full"
      title={link.label || 'Reproductor multimedia'}
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  )
}
