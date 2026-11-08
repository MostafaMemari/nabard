const UNSAFE_FILENAME_PATTERNS = [/[/\\:*?"<>|]/g, /[\p{Cc}]/gu, /^[.\s-]+|[.\s-]+$/g] as const;

export type DownloadFilename = { ascii: string; utf8: string };

export function sanitizeTitleForFilename(title: string): string {
  let clean = title;
  for (const pattern of UNSAFE_FILENAME_PATTERNS) {
    clean = clean.replace(pattern, " ");
  }

  return clean
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/[-.\s]+$/, "");
}

export function downloadFilename(prefix: string, title: string, id: string, extension: string): DownloadFilename {
  const clean = sanitizeTitleForFilename(title);
  return { ascii: `${prefix}-${id}.${extension}`, utf8: `${prefix}-${clean || id}.${extension}` };
}

export function downloadResponse(body: BodyInit, contentType: string, filename: DownloadFilename): Response {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename.ascii}"; filename*=UTF-8''${encodeURIComponent(filename.utf8)}`,
      "cache-control": "private, no-store",
    },
  });
}
