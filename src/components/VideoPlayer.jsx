import { ImageOff } from 'lucide-react';
import './VideoPlayer.css';

function toEmbedUrl(url) {
  if (!url) return null;

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

  const dailymotionMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (dailymotionMatch) return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}?autoplay=1`;

  return url;
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/i.test(url);
}

export default function VideoPlayer({ source, sourceType = 'external', onPlay, poster = '', className = '' }) {
  if (!source) {
    return (
      <div className={`vp-empty ${className}`}>
        <ImageOff size={28} strokeWidth={1} />
        <span>Video not available yet</span>
      </div>
    );
  }

  if (sourceType === 'file' || isDirectVideo(source)) {
    return (
      <video
        controls
        autoPlay
        playsInline
        preload="auto"
        className={`vp-native ${className}`}
        src={source}
        poster={poster || undefined}
        onPlay={onPlay}
      />
    );
  }

  return (
    <div className={`vp-iframe-wrap ${className}`}>
      <iframe
        src={toEmbedUrl(source)}
        title="Video player"
        frameBorder="0"
        loading="eager"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
