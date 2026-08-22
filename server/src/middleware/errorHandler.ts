import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error privately (avoid logging resume contents, just print basic message/stack)
  console.error(`[Error Handler] ${err.name}: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle typical custom errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Do not expose raw internal error details to users in production
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV === 'development' && { devMessage: err.message, stack: err.stack }),
  });
}
