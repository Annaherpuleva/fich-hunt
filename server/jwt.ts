import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-key"

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

export interface JWTPayload {
  sub: number // user id
  telegramId: number
  username: string
  role: "user" | "admin"
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  sub: number
  type: "refresh"
  iat?: number
  exp?: number
}

/**
 * Generate access token (short-lived, ~7 days)
 */
export function generateAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: "7d",
    algorithm: "HS256",
  })
}

/**
 * Generate refresh token (long-lived, ~30 days)
 */
export function generateRefreshToken(userId: number): string {
  return jwt.sign(
    {
      sub: userId,
      type: "refresh",
    } as RefreshTokenPayload,
    JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
      algorithm: "HS256",
    },
  )
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!, {
      algorithms: ["HS256"],
    })
    return payload as JWTPayload
  } catch (error) {
    console.error("[JWT] Access token verification failed:", error)
    return null
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
    })
    return payload as RefreshTokenPayload
  } catch (error) {
    console.error("[JWT] Refresh token verification failed:", error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null
  return parts[1]
}

/**
 * Decode token without verification (for debugging only)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}
