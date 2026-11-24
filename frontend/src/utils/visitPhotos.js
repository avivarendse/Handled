export const MAX_PHOTO_FILE_SIZE = 10 * 1024 * 1024
export const MAX_PENDING_PHOTOS = 5

const supportedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validatePhotoFile(file) {
  const fileName = file?.name || 'Selected file'

  if (!file || !Number.isFinite(file.size) || file.size === 0) {
    return `${fileName}: This file is empty or could not be read.`
  }
  if (!supportedPhotoTypes.has(file.type?.toLowerCase())) {
    return `${fileName}: Choose a JPEG, PNG or WebP image.`
  }
  if (file.size > MAX_PHOTO_FILE_SIZE) {
    return `${fileName}: The file must be 10 MB or smaller.`
  }

  return ''
}
