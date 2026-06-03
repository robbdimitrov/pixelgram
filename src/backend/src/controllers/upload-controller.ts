import multer from 'multer';
import fs from 'fs/promises';
import { NextFunction, Request, Response } from 'express';
import DbClient from '../db';

const signatures = [
  {bytes: [0xff, 0xd8, 0xff]},
  {bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]},
  {bytes: [0x47, 0x49, 0x46, 0x38]},
  {bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, secondary: {bytes: [0x57, 0x45, 0x42, 0x50], offset: 8}}
];

function hasBytes(buffer: Buffer, bytes: number[], offset: number = 0) {
  if (buffer.length < offset + bytes.length) {
    return false;
  }

  return bytes.every((byte: number, index: number) => buffer[offset + index] === byte);
}

function isImage(buffer: Buffer) {
  return signatures.some((signature: { bytes: number[], offset?: number, secondary?: { bytes: number[], offset: number } }) => {
    if (!hasBytes(buffer, signature.bytes, signature.offset)) {
      return false;
    }

    return !signature.secondary ||
      hasBytes(buffer, signature.secondary.bytes, signature.secondary.offset);
  });
}

export interface UploadController {
  uploader: (req: Request, res: Response, next: NextFunction) => void;
  handleUploadError: (error: unknown, res: Response) => Response;
  createFile: (req: Request, res: Response) => void;
}

export default function (imageDir: string, dbClient: DbClient): UploadController {
  const upload = multer({
    dest: imageDir,
    limits: {
      fileSize: 1000000,
      files: 1
    }
  });

  return {
    uploader: upload.single('image'),
    handleUploadError: (error: unknown, res: Response) => {
      if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
          ? 'Could not resize this image enough. Try a smaller image.'
          : 'Could not process upload.';
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        return res.status(status).send({message});
      }

      return res.status(400).send({
        message: 'Could not process upload.'
      });
    },
    createFile: (req: Request, res: Response) => {
      const file = req.file;
      if (!file) {
        return res.status(400).send({
          message: 'File missing from request.'
        });
      }

      fs.readFile(file.path).then((fileBuffer: Buffer) => {
        if (!isImage(fileBuffer)) {
          return fs.unlink(file.path).catch(() => undefined).then(() => {
            res.status(400).send({
              message: 'Only image uploads are allowed.'
            });
          });
        }

        return dbClient.createUpload(req.userId!, file.filename).then(() => {
          res.status(201).send({
            filename: file.filename
          });
        });
      }).catch(() => {
        res.status(400).send({
          message: 'Could not process upload.'
        });
      });
    }
  };
};
