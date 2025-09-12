export function encode64(image, type) {
  if (!image || !type) return { success: false, data: undefined };
  return {
    success: true,
    data: `data:${type};base64,${image.toString("base64")}`,
  };
}

export async function url_encode64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const mimeType = response.headers.get("content-type");
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
