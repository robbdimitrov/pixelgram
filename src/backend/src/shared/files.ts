import fs from 'fs/promises';
import path from 'path';

function uploadPath(imageDir: string, filename: string) {
  return path.join(imageDir, path.basename(filename));
}

function deleteUploadFile(imageDir: string, filename: string) {
  return fs.unlink(uploadPath(imageDir, filename)).catch(() => undefined);
}

function deleteUploadFiles(imageDir: string, filenames: string[]) {
  return Promise.all(filenames.map((filename: string) => deleteUploadFile(imageDir, filename)));
}

export {
  deleteUploadFile,
  deleteUploadFiles
};
