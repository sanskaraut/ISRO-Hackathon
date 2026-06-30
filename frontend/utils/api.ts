export const getApiUrl = (path: string = ""): string => {
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (!path) return cleanBase;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};
