// src/lib/exercise-image.ts
// 755 exercises were imported with an image address that repeats the exercise folder
// and adds a "dist" segment (.../main/dist/exercises/X/X/0.jpg). That path returns 404;
// the file lives at .../main/exercises/X/0.jpg. This corrects the address when it is
// rendered, so photos load whether or not the stored rows have been repaired.

const BROKEN = /\/free-exercise-db\/main\/dist\/exercises\/([^/]+)\/\1\//;

export function exerciseImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.replace(BROKEN, '/free-exercise-db/main/exercises/$1/');
}

/** onError handler: hide a photo that fails to load instead of showing its alt text */
export function hideBrokenImage(event: { currentTarget: HTMLImageElement }) {
  event.currentTarget.style.visibility = 'hidden';
}
