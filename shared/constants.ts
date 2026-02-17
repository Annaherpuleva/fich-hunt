import { MINING_CONSTANTS as BASE_MINING_CONSTANTS } from "./schema"

const parseAdditionalChannels = (): string[] => {
  const raw = process.env.ADDITIONAL_CHANNELS || ""
  return raw
    .split(",")
    .map((channel) => channel.trim())
    .filter(Boolean)
}

export const MINING_CONSTANTS = {
  ...BASE_MINING_CONSTANTS,
  REQUIRED_CHANNEL_ID: process.env.REQUIRED_CHANNEL_ID || "",
  MAIN_CHAT_ID: process.env.MAIN_CHAT_ID || "",
  ADDITIONAL_CHANNELS: parseAdditionalChannels(),
}
