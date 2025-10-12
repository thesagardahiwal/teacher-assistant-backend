import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface AuthRequest extends Request {
  teacher?: { teacherId: string; role: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // read token from cookie
  const token = req.cookies?.["auth-token"];

  if (!token) {
    return res.status(401).json({ success: false, msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    req.teacher = {
      teacherId: decoded.teacherId,
      role: decoded.role,
      ...decoded
    };

    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ success: false, msg: "Token is not valid" });
  }
};
