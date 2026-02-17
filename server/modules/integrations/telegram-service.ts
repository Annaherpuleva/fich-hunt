export type TelegramNotification = {
  userId: number
  message: string
  createdAt: Date
}

export class TelegramIntegrationService {
  private notifications: TelegramNotification[] = []

  notify(userId: number, message: string): TelegramNotification {
    const event = { userId, message, createdAt: new Date() }
    this.notifications.push(event)
    return event
  }

  getNotificationsByUser(userId: number): TelegramNotification[] {
    return this.notifications.filter((n) => n.userId === userId)
  }
}

export const telegramIntegrationService = new TelegramIntegrationService()
