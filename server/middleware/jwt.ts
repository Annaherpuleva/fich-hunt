import { type Request, type Response, type NextFunction } from "express"
import { extractTokenFromHeader, verifyAccessToken, verifyRefreshToken, generateAccessToken } from "../jwt"
import type { JWTPayload } from "../jwt"

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      token?: string
    }
  }
}

/**
 * Middleware: Verify JWT access token
 * Extracts token from Authorization header and verifies it
 */
export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      res.status(401).json({ error: "No token provided" })
      return
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" })
      return
    }

    req.user = payload
    req.token = token
    next()
  } catch (error) {
    console.error("[Auth] JWT verification error:", error)
    res.status(401).json({ error: "Authentication failed" })
  }
}

/**
 * Middleware: Verify admin role
 * Must be used after verifyJWT
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "No user in request" })
    return
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" })
    return
  }

  next()
}

/**
 * Middleware: Attempt to refresh expired token
 * If access token is expired, try to use refresh token
 */
export function autoRefreshToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      next()
      return
    }

    const payload = verifyAccessToken(token)
    if (payload) {
      req.user = payload
      req.token = token
      next()
      return
    }

    // Token is invalid/expired, check for refresh token in cookies
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      next()
      return
    }

    const refreshPayload = verifyRefreshToken(refreshToken)
    if (!refreshPayload) {
      next()
      return
    }

    // Generate new access token (note: we don't have full user data here, so we'd need to fetch from DB)
    // This is a simplified version - in production, you might want to fetch user data
    console.log("[Auth] Refresh token used to generate new access token")

    next()
  } catch (error) {
    console.error("[Auth] Auto-refresh error:", error)
    next()
  }
}

/**
 * Middleware: Optional JWT verification
 * Verifies token if present, but allows request to continue without token
 */
export function optionalJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      next()
      return
    }

    const payload = verifyAccessToken(token)
    if (payload) {
      req.user = payload
      req.token = token
    }

    next()
  } catch (error) {
    console.error("[Auth] Optional JWT verification error:", error)
    next()
  }
}
