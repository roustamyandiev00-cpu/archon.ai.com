import 'server-only'

// ============================================
// Encryption Helper for Sensitive Data
// ============================================
// Uses AES-256-GCM for encrypting passwords and API keys

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  
  if (secret) {
    // Use provided key (should be 32 bytes hex encoded = 64 chars)
    return Buffer.from(secret, 'hex')
  }
  
  // Derive key from SUPABASE_SERVICE_ROLE_KEY (fallback)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('No encryption key available. Set ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY')
  }
  
  // Derive 32-byte key using scrypt
  return scryptSync(serviceKey, 'archon-salt', 32)
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt a sensitive string value
 * Returns hex-encoded encrypted data with IV and auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Format: iv:authTag:encrypted (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt an encrypted string value
 * Returns the original plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  
  // Check if it's encrypted format (contains colons)
  if (!ciphertext.includes(':')) {
    // Not encrypted, return as-is (for backward compatibility)
    return ciphertext
  }
  
  const key = getEncryptionKey()
  const parts = ciphertext.split(':')
  
  if (parts.length !== 3) {
    // Invalid format, return as-is
    return ciphertext
  }
  
  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  try {
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    return ''
  }
}

/**
 * Mask a sensitive value for display (show last 4 chars)
 */
export function mask(value: string | null): string {
  if (!value) return ''
  if (value.length <= 4) return '••••'
  return '••••••••' + value.slice(-4)
}

/**
 * Check if a value looks encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.includes(':') && value.split(':').length === 3
}
