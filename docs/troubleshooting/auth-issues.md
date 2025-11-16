# Authentication Troubleshooting Guide

This guide provides steps to diagnose and resolve authentication issues in the MindGuard application.

## Common Authentication Issues

1. **Unable to log in** - User cannot authenticate despite correct credentials
2. **Token related errors** - "Invalid token" or "No token provided" errors
3. **Session expiration** - Getting logged out too quickly or unexpectedly
4. **Cross-device login problems** - Can log in on one device but not another

## Diagnostic Tools

### Debug Authentication Script

We provide a specialized script to diagnose authentication issues for any user type:

```bash
# Navigate to the backend directory
cd backend

# For regular users
npm run debug-auth user user@example.com [optional-password]

# For doctors
npm run debug-auth doctor doctor@example.com [optional-password]

# For admins
npm run debug-auth admin admin@example.com [optional-password]
```

## Troubleshooting Steps

### 1. Verify the User/Doctor/Admin Account Exists

Use the debug script to confirm the account exists in the database:

```bash
npm run debug-auth [user|doctor|admin] email@example.com
```

If the account is not found, it may need to be created or you may be using the wrong email address.

### 2. Verify Password Storage

The debug script will check if the password is properly hashed. If it shows:

✅ **"Password is properly hashed with bcrypt"** - Password storage is secure
⚠️ **"Password appears to be stored in plain text"** - This is a security risk

For unhashed passwords, contact the development team to run the appropriate rehashing script:
- `npm run rehash-passwords` - For regular users
- `npm run rehash-doctor-passwords` - For doctors

### 3. Test Password Verification

If you have the user's password, provide it as an optional third parameter:

```bash
npm run debug-auth user email@example.com correct-password
```

This will test if the provided password matches what's stored in the database.

### 4. Check Frontend Storage

Verify that the authentication token is being properly stored in the browser:

1. Open browser developer tools (F12)
2. Go to the Application tab
3. Navigate to Local Storage
4. Check for the presence of:
   - `token` or `mindguard_token` 
   - `userType` or `mindguard_user_type`
   - User-specific data (`doctor`, `admin`, etc.)

### 5. API Endpoints

Ensure the login requests are being sent to the correct endpoints:

- **Regular Users**: `POST http://localhost:5000/api/auth/login`
- **Doctors**: `POST http://localhost:5000/api/doctor/auth/login`
- **Admins**: `POST http://localhost:5000/api/auth/admin/login`

### 6. Network Issues

Check the browser's Network tab during login attempts:

1. Are there any CORS errors?
2. Is the server responding with the expected status code?
3. Does the response include a token?

### 7. Reset User Password (Admin Only)

If all else fails, an admin can reset a user's password:

```bash
# Navigate to the backend directory
cd backend

# For users
node scripts/reset-password.js user user@example.com new-password

# For doctors
node scripts/reset-password.js doctor doctor@example.com new-password
```

## Common Error Scenarios and Solutions

| Error | Possible Cause | Solution |
|-------|----------------|----------|
| "Invalid credentials" | Password mismatch or user doesn't exist | Verify email and password |
| "Token expired" | JWT token has passed its expiration time | Log in again to get a fresh token |
| "Invalid token" | Token has been tampered with or is corrupt | Clear localStorage and log in again |
| "Cannot read properties of undefined" | User data not properly retrieved after login | Check API response format |

## Contact Support

If you've gone through this guide and still experiencing issues, please contact the development team with:

1. The exact error message
2. Steps to reproduce the issue
3. User type and email address
4. Browser and device information 