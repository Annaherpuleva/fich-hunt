import "dotenv/config"
import fs from "node:fs"
import path from "node:path"
import type { Server } from "node:http"

import express, { type Express } from "express"
import runApp from "./app"

export async function serveStatic(app: Express, _server: Server) {
  const distPath = path.resolve(process.cwd(), "dist", "public")

  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`)
  }

  fs.readdirSync(distPath)

  const assetsPath = path.resolve(distPath, "assets")
  if (fs.existsSync(assetsPath)) {
    fs.readdirSync(assetsPath)
  }

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

    if (req.url.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8")
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    } else if (req.url.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css; charset=utf-8")
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    } else if (req.url.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png")
    } else if (req.url.endsWith(".jpg") || req.url.endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg")
    } else if (req.url.endsWith(".svg")) {
      res.setHeader("Content-Type", "image/svg+xml")
    }

    next()
  })

  const indexPath = path.resolve(distPath, "index.html")
  if (!fs.existsSync(indexPath)) {
    console.error(`ERROR: index.html not found at ${indexPath}`)
  } else {
    fs.readFileSync(indexPath, "utf-8")
  }

  app.use(
    express.static(distPath, {
      etag: true,
      lastModified: true,
      setHeaders: (res, filepath) => {
        if (filepath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache")
        }
      },
    }),
  )

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next()
      return
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.sendFile(path.resolve(distPath, "index.html"))
  })
}
;(async () => {
  await runApp(serveStatic)
})()
