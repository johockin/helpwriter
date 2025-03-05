export default function netlifyImageLoader({ src, width, quality }) {
  // For absolute URLs (external images), return as is
  if (src.startsWith('http')) {
    return src;
  }

  // For local images, use Netlify Image CDN
  return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
} 