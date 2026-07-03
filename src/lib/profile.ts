import { fetchWithSession } from "./auth-session";

export const getTokenStats = async () => {
  const url = `${import.meta.env.VITE_API_URL}/ai/me/tokens`;
  const res = await fetchWithSession(url);
  const data = await res.json();

  return data;
};
