import { useEffect, useState } from 'react';
import { resolveStoredMediaUrl } from '../utils/resolveStoredMediaUrl';
import './CaseAttachedImageSection.css';

export default function CaseAttachedImageSection({
  attachment,
  title = 'Attached image',
  classPrefix = 'case-attached-image',
}) {
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const directUrl = String(attachment?.url || '').trim();
  const mediaId = String(attachment?.mediaId || '').trim();
  const objectKey = String(attachment?.objectKey || '').trim();
  const hasAttachment = Boolean(directUrl || mediaId || objectKey);

  useEffect(() => {
    setExpanded(false);

    if (!hasAttachment) {
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
          setError('Unable to load the attached image.');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load the attached image.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [directUrl, mediaId, objectKey, hasAttachment]);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  if (!hasAttachment) return null;

  const displayUrl = resolvedUrl || directUrl;

  return (
    <section className={classPrefix}>
      <h3 className={`${classPrefix}__title`}>{title}</h3>

      {loading && (
        <p className={`${classPrefix}__status`} role="status" aria-live="polite">
          Loading image…
        </p>
      )}

      {error && !loading && (
        <p className={`${classPrefix}__error`} role="alert">
          {error}
        </p>
      )}

      {displayUrl && !loading && !error && (
        <button
          type="button"
          className={`${classPrefix}__preview`}
          onClick={() => setExpanded(true)}
          aria-label="View attached case image full size"
        >
          <img
            src={displayUrl}
            alt="Image attached to this case"
            className={`${classPrefix}__img`}
            loading="lazy"
          />
        </button>
      )}

      {expanded && displayUrl && (
        <div
          className={`${classPrefix}__lightbox`}
          role="dialog"
          aria-modal="true"
          aria-label="Attached case image preview"
          onClick={() => setExpanded(false)}
        >
          <img
            src={displayUrl}
            alt="Image attached to this case"
            className={`${classPrefix}__lightbox-img`}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
