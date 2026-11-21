const apiOrigin = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

export const assetUrl = (url) => {
  if (!url) return "";

  if (/^(?:https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  return `${apiOrigin}/${url.replace(/^\/+/, "")}`;
};
