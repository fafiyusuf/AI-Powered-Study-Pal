// middlewares/errorHandler.ts
import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/customError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isProd = process.env.NODE_ENV === 'production';
  const when = new Date().toISOString();
  const route = `${req.method} ${req.originalUrl}`;
  const userId = (req as any)?.user?.id || 'anon';
  const isAIRoute = typeof req.originalUrl === 'string' && req.originalUrl.startsWith('/api/ai/');

  // Determine status and message
  const status = err instanceof CustomError ? err.statusCode : 500;
  const message = err?.message || 'Unknown error';

  // Structured log for observability
  // Do not dump headers or bodies to avoid leaking secrets
  // Include stack only in non-production to keep logs useful locally
  // eslint-disable-next-line no-console
  console.error(
    `[Error ${status}] ${when} ${route} user=${userId} :: ${message}`
  );
  if (!isProd && err?.stack) {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }

  // Handle Multer errors explicitly (e.g., file too large)
  if (err?.name === 'MulterError') {
    const code = err?.code as string | undefined;
    const tooLarge = code === 'LIMIT_FILE_SIZE';
    const maxMb = process.env.AI_MAX_UPLOAD_MB || '10';
    const clientMessage = tooLarge
      ? `AI: File too large. Max ${maxMb} MB.`
      : `AI: Upload failed (${code || 'multer_error'}).`;
    // 413 Payload Too Large for size limits, else 400
    return res.status(tooLarge ? 413 : 400).json({
      message: clientMessage,
      ...(isProd ? {} : { error: { name: err?.name, message: err?.message, stack: err?.stack } }),
    });
  }

  // Build response
  if (err instanceof CustomError) {
    return res.status(status).json({
      message: err.message,
      ...(isProd
        ? {}
        : { error: { name: err.name, message: err.message } }),
    });
  }

  // For non-CustomError, surface a safer but more descriptive message in non-production.
  const clientMessage = isProd
    ? 'Something went wrong'
    : (isAIRoute ? `AI: ${message}` : message);

  return res.status(500).json({
    message: clientMessage,
    ...(isProd
      ? {}
      : { error: { name: err?.name, message: err?.message, stack: err?.stack } }),
  });
};
