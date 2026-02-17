import type { Request, Response, NextFunction } from "express"
import { storage } from "../storage-db"

export interface AuthRequest extends Request {
  user?: any
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    const user = await storage.getUser(userId)
    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(500).json({ error: "Authentication failed" })
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    const user = await storage.getUser(userId)
    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Admin auth middleware error:", error)
    return res.status(500).json({ error: "Authentication failed" })
  }
}
