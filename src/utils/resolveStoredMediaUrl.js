import { apiFetch } from '../api';

/** Extract a public/signed URL from common API payload shapes. */
export function extractUrlFromPayload(payload) {
  if (!payload) return null;

  const url =
    payload?.url
    || payload?.link?.url
    || payload?.data?.url
    || payload?.data?.link?.url
    || payload?.media?.link?.url
    || payload?.media?.url
    || payload?.upload?.url
    || payload?.downloadUrl
    || payload?.signedUrl
    || payload?.presignedUrl
    || null;

  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

/**
 * Resolve a viewable URL for stored media. Tries all known backend routes in parallel
 * so the first successful response wins (faster than sequential probing).
 */
export async function resolveStoredMediaUrl({ mediaId, objectKey } = {}) {
  const normalizedMediaId = String(mediaId || '').trim();
  const normalizedObjectKey = String(objectKey || '').trim();

  if (!normalizedMediaId && !normalizedObjectKey) return null;

  const requestCandidates = [
    {
      path: '/media/b2/view-url',
      method: 'POST',
      body: {
        ...(normalizedMediaId ? { mediaId: normalizedMediaId } : {}),
        ...(normalizedObjectKey ? { objectKey: normalizedObjectKey } : {}),
      },
    },
    {
      path: '/media/b2/download-url',
      method: 'POST',
      body: {
        ...(normalizedMediaId ? { mediaId: normalizedMediaId } : {}),
        ...(normalizedObjectKey ? { objectKey: normalizedObjectKey } : {}),
      },
    },
    ...(normalizedMediaId
      ? [
          { path: `/media/${normalizedMediaId}`, method: 'GET' },
          { path: `/media/${normalizedMediaId}/link`, method: 'GET' },
        ]
      : []),
  ];

  const results = await Promise.all(
    requestCandidates.map(async (candidate) => {
      try {
        const response = await apiFetch(candidate.path, {
          method: candidate.method,
          ...(candidate.body ? { body: JSON.stringify(candidate.body) } : {}),
          quiet: true,
        });
        const responseText = await response.text().catch(() => '');
        let payload = {};
        if (responseText) {
          try {
            payload = JSON.parse(responseText);
          } catch {
            payload = { url: responseText };
          }
        }
        if (!response.ok) return null;
        return extractUrlFromPayload(payload);
      } catch {
        return null;
      }
    }),
  );

  return results.find(Boolean) || null;
}
