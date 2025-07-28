import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../server";

export async function refreshGoogleToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("refresh token is required");
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to refresh token: ${response.status} - ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {}
}
