import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Canonical role values used across the platform.
export const ROLES = {
  CONSUMER: "CONSUMER",
  TRADE: "TRADE",
  NDIS_COORDINATOR: "NDIS_COORDINATOR",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Normalise legacy values: "USER" was the old consumer role.
export const normaliseRole = (role?: string | null): string =>
  role === "USER" || !role ? ROLES.CONSUMER : role;

// Must be used AFTER `auth`, which sets req.userId.
// Allows the request through only if the user's role is in `allowed`.
export const requireRole =
  (...allowed: string[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: true, message: "Authentication required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const role = normaliseRole(user?.role);
      if (!user || !allowed.includes(role)) {
        return res.status(403).json({
          success: false,
          error: true,
          message: "Access denied. Insufficient privileges.",
        });
      }

      req.userRole = role;
      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: true,
        message: error.message || "Internal server error!",
      });
    }
  };