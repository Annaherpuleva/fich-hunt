import type { Express, Server } from "express"
import http from "node:http"

import { setupAuthModuleRoutes } from "../modules/auth/routes"
import { setupBillingModuleRoutes } from "../modules/billing/routes"
import { setupDomainModuleRoutes } from "../modules/domain/routes"
import { setupAdminModuleRoutes } from "../modules/admin/routes"
import { setupIntegrationsModuleRoutes } from "../modules/integrations/routes"

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuthModuleRoutes(app)
  setupDomainModuleRoutes(app)
  setupBillingModuleRoutes(app)
  setupIntegrationsModuleRoutes(app)
  setupAdminModuleRoutes(app)

  const server = http.createServer(app)
  return server
}
