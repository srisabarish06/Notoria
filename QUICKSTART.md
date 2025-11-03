# Quick Start Guide

## Prerequisites Check

- ✅ Node.js installed (v16+)
- ✅ MongoDB running locally or MongoDB Atlas account
- ✅ Terminal/Command Prompt ready

## Step-by-Step Setup

### 1. Start MongoDB

**Local MongoDB:**
```bash
# On Windows
net start MongoDB

# On Mac/Linux
sudo systemctl start mongod
# or
mongod
```

**MongoDB Atlas:**
- Use your connection string in the `.env` file

### 2. Backend Setup (Terminal 1)

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/notoria
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

✅ Backend should be running on http://localhost:5000

### 3. Student Frontend Setup (Terminal 2)

```bash
cd student-frontend
npm install
```

Create `student-frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

✅ Frontend should be running on http://localhost:5173

### 4. Admin Frontend Setup (Terminal 3 - Optional)

```bash
cd admin-frontend
npm install
npm run dev
```

✅ Admin panel should be running on http://localhost:5174

## First Steps

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Create your first note
4. Explore the features!

## Creating an Admin User

After registering a user, update MongoDB:

```javascript
// In MongoDB shell or Compass
use notoria
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { isAdmin: true } }
)
```

Then login to http://localhost:5174 with that account.

## Troubleshooting

**Backend won't start:**
- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check if port 5000 is available

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Check browser console for CORS errors

**Socket.IO not working:**
- Verify `VITE_SOCKET_URL` in frontend `.env`
- Check backend Socket.IO configuration in `server.js`
