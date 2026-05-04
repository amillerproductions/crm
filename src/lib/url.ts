export function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.includes(" ")) {
    return null;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }

  if (trimmed.includes(".")) {
    return `https://${trimmed}`;
  }

  return null;
}
