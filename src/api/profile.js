import { http, MOCK } from '../lib/http.js';

const PHOTO_PATH = '/members/me/photo';

export async function getMyPhoto() {
  if (MOCK) return null;
  return http.getBlob(PHOTO_PATH);
}

export async function saveMyPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  return http.put(PHOTO_PATH, { body: form });
}
