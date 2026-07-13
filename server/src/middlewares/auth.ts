import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();


interface AuthRequest extends Request {
  userId?: string;
}
export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1];

    // Validate token type
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or invalid"
      });
    }

    // Verify secret exists
    const secret = process.env.SECRET_KEY_ACCESS_TOKEN;


    // Verify token
    const decoded = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN as string) as {id:string};
    req.userId = decoded.id;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message === 'jwt must be a string'
        ? 'Invalid token format'
        : 'Invalid or expired token'
    });
  }
};