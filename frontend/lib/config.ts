// API configurations
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8000';

// Authentication
export const tokenKey = 'mindguard_token';
export const userIdKey = 'mindguard_user_id';
export const userTypeKey = 'mindguard_user_type'; // 'patient', 'doctor', 'admin'

// Other configurations
export const debounceTime = 500; // milliseconds
export const maxAttachmentSize = 10 * 1024 * 1024; // 5MB 