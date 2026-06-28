import { useEffect, useState } from 'react';
import { resolveStoredMediaUrl } from '../utils/resolveStoredMediaUrl';
import './IncidentImagesSection.css';

function IncidentImageTile({ attachment, alt, onOpen }) {
  const directUrl = String(attachment?.url || '').trim();
  const mediaId = String(attachment?.mediaId || '').trim();
  const objectKey = String(attachment?.objectKey || '').trim();
  const hasSource = Boolean(directUrl || mediaId || objectKey);

  const [resolvedUrl, setResolvedUrl] = useState(directUrl);
  const [loading, setLoading] = useState(Boolean(!directUrl && hasSource));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasSource) {
      setResolvedUrl('');
      setLoading(false);
      setError('');
      return undefined;
    }

    if (directUrl) {
      setResolvedUrl(directUrl);
      setLoading(false);
      setError('');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setResolvedUrl('');

    resolveStoredMediaUrl({ mediaId, objectKey })
      .then((url) => {
        if (cancelled) return;
        if (url) {
          setResolvedUrl(url);
          setError('');
        } else {
          setError('Could not load');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [directUrl, mediaId, objectKey, hasSource]);

  if (!hasSource) return null;

  if (loading) {
    return (
      <div className="incident-images__tile incident-images__tile--loading">
        <span>Loading…</span>
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className="incident-images__tile incident-images__tile--error">
        <span>{error || 'Unavailable'}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="incident-images__tile"
      onClick={() => onOpen(resolvedUrl)}
      aria-label={`View ${alt}`}
    >
      <img src={resolvedUrl} alt={alt} className="incident-images__img" loading="lazy" />
    </button>
  );
}

export default function IncidentImagesSection({
  images = [],
  title = 'Photos',
  emptyMessage = 'No photos attached to this report.',
  className = '',
}) {
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    if (!lightboxUrl) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setLightboxUrl('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  useEffect(() => {
    setLightboxUrl('');
  }, [images]);

  const openLightbox = (url, index = 0) => {
    setLightboxIndex(index);
    setLightboxUrl(url);
  };

  if (!validImages.length) {
    return (
      <section className={`incident-images incident-images--empty ${className}`.trim()}>
        <h5 className="incident-images__title">{title}</h5>
        <p className="incident-images__empty">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className={`incident-images ${className}`.trim()}>
      <h5 className="incident-images__title">
        {title}
        <span className="incident-images__count">{validImages.length}</span>
      </h5>

      <div className="incident-images__grid">
        {validImages.map((attachment, index) => (
          <IncidentImageTile
            key={`${attachmentDedupeKey(attachment)}-${index}`}
            attachment={attachment}
            alt={`Incident photo ${index + 1}`}
            onOpen={(url) => openLightbox(url, index)}
          />
        ))}
      </div>

      {lightboxUrl && (
        <div
          className="incident-images__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Incident photo preview"
          onClick={() => setLightboxUrl('')}
        >
          <img
            src={lightboxUrl}
            alt={`Incident photo ${lightboxIndex + 1}`}
            className="incident-images__lightbox-img"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}

function attachmentDedupeKey(attachment) {
  if (!attachment) return '';
  return String(
    attachment.url
    || `${attachment.mediaId || ''}|${attachment.objectKey || ''}`,
  ).trim();
}
