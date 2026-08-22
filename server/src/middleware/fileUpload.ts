import multer from 'multer';
import { Request } from 'express';

// Use memory storage to process PDF buffers directly without writing to disk
const storage = multer.memoryStorage();

// Accept only PDF files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF resumes are accepted.') as any, false);
  }
};

// Limit resume files to 5MB
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
