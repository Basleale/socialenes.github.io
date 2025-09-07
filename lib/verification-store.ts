// Simple in-memory store for verification codes
interface VerificationData {
  code: string
  email: string
  name: string
  password: string
  expiresAt: number
}

const verificationStore = new Map<string, VerificationData>()

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeVerificationCode(email: string, code: string, name: string, password: string): void {
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  verificationStore.set(email, { code, email, name, password, expiresAt })
}

export function verifyCode(email: string, code: string): VerificationData | null {
  const data = verificationStore.get(email)

  if (!data) {
    return null
  }

  if (Date.now() > data.expiresAt) {
    verificationStore.delete(email)
    return null
  }

  if (data.code !== code) {
    return null
  }

  // Code is valid, remove it from store
  verificationStore.delete(email)
  return data
}

// Cleanup expired codes every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [email, data] of verificationStore.entries()) {
      if (now > data.expiresAt) {
        verificationStore.delete(email)
      }
    }
  },
  5 * 60 * 1000,
)
