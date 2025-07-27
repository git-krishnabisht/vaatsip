export function encode64(image, type) {
  if (!image || !type) return { success: false, data: undefined };
  return {
    success: true,
    data: `data:${type};base64,${image.toString("base64")}`,
  };
}
