import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

interface TCustomError extends Error {
  statusCode?: number;
}

const globalErrorHandler: ErrorRequestHandler = (
  err: TCustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err,
  });
};

export default globalErrorHandler;
