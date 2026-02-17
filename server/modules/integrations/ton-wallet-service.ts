export interface TonConnectManifest {
  url: string
  name: string
  iconUrl: string
  termsOfUseUrl: string
  privacyPolicyUrl: string
  supportedWallets: string[]
}

const defaultSupportedWallets = [
  "tonkeeper",
  "tonhub",
  "mytonwallet",
  "openmask",
  "tonwallet",
]

export class TonWalletService {
  getTonConnectManifest(): TonConnectManifest {
    const baseUrl = process.env.APP_URL ?? "https://example.org"
    return {
      url: baseUrl,
      name: "HodlHunt",
      iconUrl: `${baseUrl}/icon-512.png`,
      termsOfUseUrl: `${baseUrl}/terms`,
      privacyPolicyUrl: `${baseUrl}/privacy`,
      supportedWallets: defaultSupportedWallets,
    }
  }
}

export const tonWalletService = new TonWalletService()
