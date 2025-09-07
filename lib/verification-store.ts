// Simple in-memory store for verification codes
interface VerificationCode {
  code: string
  email: string
  name: string
  password: string
  expiresAt: number
}

class VerificationStore {
  private codes = new Map<string, VerificationCode>()

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  storeCode(email: string, name: string, password: string): string {
    const code = this.generateCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    this.codes.set(email, {
      code,
      email,
      name,
      password,
      expiresAt,
    })

    // Clean up expired codes
    this.cleanupExpired()

    return code
  }

  verifyCode(email: string, inputCode: string): VerificationCode | null {
    const stored = this.codes.get(email)

    if (!stored) {
      return null
    }

    if (Date.now() > stored.expiresAt) {
      this.codes.delete(email)
      return null
    }

    if (stored.code !== inputCode) {
      return null
    }

    // Code is valid, remove it from store
    this.codes.delete(email)
    return stored
  }

  private cleanupExpired() {
    const now = Date.now()
    for (const [email, data] of this.codes.entries()) {
      if (now > data.expiresAt) {
        this.codes.delete(email)
      }
    }
  }
}

export const verificationStore = new VerificationStore()
