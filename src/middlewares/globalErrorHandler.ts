import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

interface TCustomError extends Error {
  statusCode?: number;
  code?: string;
}

const globalErrorHandler: ErrorRequestHandler = (
  err: TCustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong!";

  if (err.code === "22P02") {
    statusCode = 400;
    message = "Invalid ID format. Please provide a numeric ID.";
  } 

  res.status(statusCode).json({
    success: false,
    message,
    errors: message,
  });
};

export default globalErrorHandler;
