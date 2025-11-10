// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/customError'; 

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error('❌ Unexpected Error:', err);
  res.status(500).json({ message: 'Something went wrong' });
};
