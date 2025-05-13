/**
 * Dashboard Authentication
 * Handles token verification and authentication for dashboard API
 */

const crypto = require('crypto');
const logger = require('../logger');

// Token cache for faster verification
const tokenCache = new Map();

// Secret for JWT signing (use a strong key)
const JWT_SECRET = process.env.JWT_SECRET || 'astrobot-dashboard-secret';

// Token expiration in seconds
const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {boolean} Whether the token is valid
 */
function verifyToken(token) {
  try {
    // Check cache first
    if (tokenCache.has(token)) {
      const { payload, expires } = tokenCache.get(token);
      
      // Check if expired
      if (expires < Date.now()) {
        tokenCache.delete(token);
        return false;
      }
      
      return true;
    }
    
    // Parse the token
    const [headerB64, payloadB64, signature] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signature) {
      return false;
    }
    
    // Decode the payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    // Check if expired
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const isValid = signature === expectedSignature;
    
    // Store in cache if valid
    if (isValid) {
      tokenCache.set(token, {
        payload,
        expires: payload.exp * 1000 // Convert to milliseconds
      });
      
      // Schedule removal from cache
      setTimeout(() => {
        tokenCache.delete(token);
      }, (payload.exp * 1000) - Date.now());
    }
    
    return isValid;
  } catch (error) {
    logger.error('Error verifying token:', error);
    return false;
  }
}

/**
 * Generate a JWT token for a user
 * @param {string} userId - The Discord user ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {string} The JWT token
 */
function generateToken(userId, isAdmin = false) {
  try {
    // Create header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    // Create payload
    const now = Math.floor(Date.now() / 1000);
    const expires = now + TOKEN_EXPIRY;
    
    const payload = {
      sub: userId,
      iat: now,
      exp: expires,
      admin: isAdmin
    };
    
    // Encode header and payload
    const headerB64 = Buffer.from(JSON.stringify(header))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const payloadB64 = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    // Create signature
    const data = `${headerB64}.${payloadB64}`;
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    // Combine into token
    const token = `${headerB64}.${payloadB64}.${signature}`;
    
    // Store in cache
    tokenCache.set(token, {
      payload,
      expires: expires * 1000 // Convert to milliseconds
    });
    
    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    throw error;
  }
}

/**
 * Invalidate a token
 * @param {string} token - The token to invalidate
 * @returns {boolean} Whether the token was invalidated
 */
function invalidateToken(token) {
  try {
    if (tokenCache.has(token)) {
      tokenCache.delete(token);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error invalidating token:', error);
    return false;
  }
}

/**
 * Clean up expired tokens
 * @returns {number} Number of tokens removed
 */
function cleanupTokens() {
  try {
    const now = Date.now();
    let removed = 0;
    
    for (const [token, { expires }] of tokenCache.entries()) {
      if (expires < now) {
        tokenCache.delete(token);
        removed++;
      }
    }
    
    return removed;
  } catch (error) {
    logger.error('Error cleaning up tokens:', error);
    return 0;
  }
}

module.exports = {
  verifyToken,
  generateToken,
  invalidateToken,
  cleanupTokens
};