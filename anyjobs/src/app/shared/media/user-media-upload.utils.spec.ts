import {
  formatFileSizeMb,
  isUploadFileTooLarge,
  resolveUploadMimeType,
  USER_MEDIA_MAX_BYTES,
} from './user-media-upload.utils';

describe('user-media-upload.utils', () => {
  it('detects file over limit', () => {
    expect(isUploadFileTooLarge(USER_MEDIA_MAX_BYTES + 1)).toBe(true);
    expect(isUploadFileTooLarge(USER_MEDIA_MAX_BYTES)).toBe(false);
  });

  it('formats size in MB', () => {
    expect(formatFileSizeMb(52_428_800)).toBe('50.0 MB');
  });

  it('resolves mime from extension when type is empty', () => {
    const file = { name: 'reel.mp4', type: '' } as File;
    expect(resolveUploadMimeType(file)).toBe('video/mp4');
  });
});
