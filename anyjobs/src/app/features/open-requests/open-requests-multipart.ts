import type { CreateOpenRequestInput, PatchOpenRequestInput } from './open-requests.models';

/** Máximo de archivos por petición (`FilesInterceptor('files', 6)` en el backend). */
export const MAX_OPEN_REQUEST_UPLOAD_FILES = 6;

/**
 * Serializa crear o patch de solicitud abierta a `multipart/form-data` compatible con Nest
 * (`CreateOpenRequestDto` / `PatchOpenRequestDto` + `files`).
 */
export function buildOpenRequestCreateFormData(input: Readonly<CreateOpenRequestInput>): FormData {
  const fd = new FormData();

  fd.append('title', input.title.trim());
  fd.append('excerpt', input.excerpt.trim());
  fd.append('description', input.description.trim());
  fd.append('tags', JSON.stringify([...input.tags]));
  fd.append('locationLabel', input.locationLabel.trim());
  fd.append('budgetLabel', input.budgetLabel.trim());

  if (input.workConditions) {
    fd.append('workConditions', JSON.stringify(input.workConditions));
  }

  const pub = input.publishedAtLabel?.trim() ?? '';
  if (pub.length > 0) fd.append('publishedAtLabel', pub);

  const imageUrl = input.imageUrl?.trim() ?? '';
  if (imageUrl.length > 0) fd.append('imageUrl', imageUrl);

  const imageAlt = input.imageAlt?.trim() ?? '';
  if (imageAlt.length > 0) fd.append('imageAlt', imageAlt);

  if (input.imagesJson !== undefined && input.imagesJson.trim().length > 0) {
    fd.append('images', input.imagesJson.trim());
  }

  appendFiles(fd, input.imageFiles);
  return fd;
}

/** Construye `FormData` para `PATCH`: solo incluye claves presentes en `patch` y archivos opcionales. */
export function buildOpenRequestPatchFormData(patch: PatchOpenRequestInput): FormData {
  const fd = new FormData();

  if (patch.title !== undefined) fd.append('title', patch.title.trim());
  if (patch.excerpt !== undefined) fd.append('excerpt', patch.excerpt.trim());
  if (patch.description !== undefined) fd.append('description', patch.description.trim());
  if (patch.tags !== undefined) fd.append('tags', JSON.stringify([...patch.tags]));
  if (patch.locationLabel !== undefined) fd.append('locationLabel', patch.locationLabel.trim());
  if (patch.budgetLabel !== undefined) fd.append('budgetLabel', patch.budgetLabel.trim());
  if (patch.workConditions !== undefined) {
    fd.append('workConditions', JSON.stringify(patch.workConditions));
  }
  if (patch.contactPhone !== undefined) fd.append('contactPhone', patch.contactPhone.trim());
  if (patch.contactEmail !== undefined) fd.append('contactEmail', patch.contactEmail.trim());

  if (patch.publishedAtLabel !== undefined) {
    const v = patch.publishedAtLabel.trim();
    if (v.length > 0) fd.append('publishedAtLabel', v);
  }

  if (patch.imageUrl !== undefined) {
    const v = patch.imageUrl.trim();
    if (v.length > 0) fd.append('imageUrl', v);
  }

  if (patch.imageAlt !== undefined) {
    const v = patch.imageAlt.trim();
    if (v.length > 0) fd.append('imageAlt', v);
  }

  if (patch.imagesJson !== undefined && patch.imagesJson.trim().length > 0) {
    fd.append('images', patch.imagesJson.trim());
  }

  appendFiles(fd, patch.imageFiles);
  return fd;
}

function appendFiles(fd: FormData, imageFiles: readonly File[] | undefined): void {
  if (!imageFiles || imageFiles.length === 0) return;
  for (const file of imageFiles.slice(0, MAX_OPEN_REQUEST_UPLOAD_FILES)) {
    fd.append('files', file, file.name);
  }
}
