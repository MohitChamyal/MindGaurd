import jwt from 'jsonwebtoken';

/**
 * Verifies an authorization token
 * @param authHeader The authorization header string (Bearer token)
 * @returns The decoded token payload or null if invalid
 */
export const verifyAuthToken = (authHeader: string): any | null => {
  try {
    // Remove Bearer prefix if present
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : authHeader;
    
    if (!token) return null;
    
    // For frontend verification, we can do a basic check
    // The real verification happens on the backend with proper secret key
    const decoded = jwt.decode(token);
    
    if (!decoded || typeof decoded !== 'object') {
      console.error('Token is not valid JWT format');
      return null;
    }
    
    // Check if token is expired based on exp claim
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.error('Token is expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Gets the user ID from a token
 * @param token The JWT token
 * @returns The user ID or null if not found
 */
export const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded: any = jwt.decode(token);
    if (!decoded) return null;
    
    // Different JWT structures might store the ID differently
    // Check common variations
    if (decoded.id) return decoded.id;
    if (decoded.user && decoded.user.id) return decoded.user.id;
    if (decoded.userId) return decoded.userId;
    if (decoded.sub) return decoded.sub;
    
    return null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

/**
 * Gets the user type/role from a token
 * @param token The JWT token
 * @returns The user type/role or null if not found
 */
export const getUserTypeFromToken = (token: string): string | null => {
  try {
    const decoded: any = jwt.decode(token);
    if (!decoded) return null;
    
    // Different JWT structures might store the role differently
    if (decoded.role) return decoded.role;
    if (decoded.userType) return decoded.userType;
    if (decoded.type) return decoded.type;
    
    return null;
  } catch (error) {
    console.error('Error extracting user type from token:', error);
    return null;
  }
};

/**
 * Checks if the current token is valid
 * @returns Boolean indicating if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  try {
    // Don't run on server-side
    if (typeof window === 'undefined') return false;
    
    // Check for token in localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token');
    
    if (!token) return false;
    
    // Verify token is valid
    const decoded: any = jwt.decode(token);
    
    if (!decoded || typeof decoded !== 'object') return false;
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) return false;
    
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Extracts authentication token from various storage locations
 * @returns The token string or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('mindguard_token') ||
    sessionStorage.getItem('token') ||
    null
  );
}; 