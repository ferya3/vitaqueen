/** Public URL of a stored upload. Served by `app/uploads/[...path]/route.ts`. */
export function mediaUrl(path: string) {
  return `/uploads/${path}`;
}
