# 🔐 Authentication Setup Guide

## What Was Fixed

### ✅ Login Form Data Capture
- Fixed input field value retrieval
- Added form data validation
- Added email format validation
- Added password length validation
- Clears form after successful login
- Added console logging for debugging

### ✅ Google OAuth 2.0 Integration
- Backend: Added `/api/auth/google` endpoint
- Frontend: Added Google Sign-In button
- Automatic user creation from Google profile
- JWT token generation for Google users

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Set Up Google OAuth

#### Step A: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (name it "Mike's Pizza")
3. Enable the Google+ API
4. Create OAuth 2.0 Credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5173`
     - `http://localhost:5001`
     - `http://localhost:3000` (if testing locally)
   - Copy your **Client ID**

#### Step B: Configure Your App

**Backend (.env)**

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

**Frontend (.env.local or vite.config.js)**

Add to your Vite environment variables:

```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

### 3. Run the Application

**Terminal 1: Backend**

```bash
cd backend
npm start
```

Expected output:
```
🍕 Backend listening on http://localhost:5001
🔄 Syncing database...
✅ Database synced successfully!
```

**Terminal 2: Frontend**

```bash
cd frontend
npm run dev
```

Expected output:
```
Front-end server running at: http://localhost:5173
```

### 4. Test Login

#### Email/Password Login
1. Click "Login/Register" button
2. Enter email and password
3. Click "Login" or "Create Account"
4. Should see welcome message and redirect

#### Google Sign-In
1. Click "Login/Register" button
2. Click "Sign in with Google" button
3. Select your Google account
4. Should auto-create account and log in

---

## 🔍 Debugging

### Check Console Logs

Open browser DevTools (F12) and check:

```javascript
// Should see:
🔐 Auth submit triggered
📝 Form data: { email: "test@example.com", password: "...", isRegister: false }
📡 Sending request to: http://localhost:5001/api/auth/login
📥 Response: { status: 200, data: {...} }
✅ User authenticated: { id: 1, email: "...", name: "...", role: "customer" }
```

### Test API Endpoints

```bash
# Test login (replace with actual credentials)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Test profile (replace TOKEN)
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Issues

#### "GOOGLE_CLIENT_ID is not defined"
- Make sure you added GOOGLE_CLIENT_ID to backend/.env
- Restart backend server after updating .env

#### "Google Sign-In button not showing"
- Check browser console for Google API load errors
- Verify VITE_GOOGLE_CLIENT_ID is set in frontend
- Clear browser cache (Ctrl+Shift+Delete)

#### "Invalid credentials"
- Make sure you seeded users first: `npm run seed:users`
- Check email/password are correct
- Check database has Users table

#### "Too many keys specified" error
- Run: `npm run db-reset` (deletes all data)
- Or manually: `DROP DATABASE mikes_pizza; CREATE DATABASE mikes_pizza;`

---

## 🛡️ Security Notes

### JWT Secret
- Change `JWT_SECRET` in `.env` for production
- Never commit real secrets to GitHub
- Use environment variables in production

### Google OAuth
- Keep `GOOGLE_CLIENT_ID` private in backend
- `VITE_GOOGLE_CLIENT_ID` is safe to expose (frontend public key)
- Never expose `GOOGLE_CLIENT_SECRET` in frontend

### Password Hashing
- Passwords automatically hashed with bcrypt
- 10-round salt cost for security
- Never store plain text passwords

---

## 📝 API Endpoints

### POST /api/auth/login
Login with email and password

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/register
Create new account

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "555-1234",
  "address": "123 Main St"
}
```

### POST /api/auth/google
Google OAuth login

```json
{
  "googleToken": "ID_TOKEN_FROM_GOOGLE"
}
```

### GET /api/auth/profile
Get user profile (requires token)

```
Headers: Authorization: Bearer YOUR_TOKEN
```

---

## 🎯 Next Steps

- [ ] Test email/password login
- [ ] Set up Google OAuth
- [ ] Test Google Sign-In
- [ ] Verify admin login works
- [ ] Check admin panel loads
- [ ] Test order creation as customer
- [ ] Verify order history loads

---

## 📚 Resources

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [JWT Documentation](https://jwt.io)
- [Sequelize Authentication](https://sequelize.org)

---

**Questions?** Check the console logs and API responses for detailed error messages! 🍕
