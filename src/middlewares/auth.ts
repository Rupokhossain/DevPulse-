import type { NextFunction, Request, Response } from "express";

import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";

export const auth = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      const decoded = jwt.verify(
        token as string,
        config.jwt_secret as string,
      ) as JwtPayload;

      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!",
        });
      }
      req.user = decoded;

      next();
    } catch (error: unknown) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token!",
      });
    }
  };
};
