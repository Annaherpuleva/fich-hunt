import type { Express, NextFunction, Request, Response } from "express"

const blockedPrefixes = ["/api", "/refferal", "/referral"]

function isBrowserNavigation(req: Request) {
  const accept = req.headers.accept ?? ""
  const secFetchMode = req.headers["sec-fetch-mode"]
  const secFetchDest = req.headers["sec-fetch-dest"]

  if (!(req.method === "GET" || req.method === "HEAD")) {
    return false
  }

  return (
    accept.includes("text/html") ||
    secFetchMode === "navigate" ||
    secFetchDest === "document"
  )
}

function blockBrowserAccess(req: Request, res: Response, next: NextFunction) {
  const path = req.path || req.originalUrl || ""
  const isBlockedPath = blockedPrefixes.some((prefix) => path.startsWith(prefix))

  if (isBlockedPath && isBrowserNavigation(req)) {
    return res.status(403).send("API access is disabled in browser")
  }

  return next()
}

export function registerBrowserAccessGuards(app: Express) {
  if (app.locals.browserAccessGuardRegistered) {
    return
  }

  app.locals.browserAccessGuardRegistered = true
  app.use(blockBrowserAccess)
}
