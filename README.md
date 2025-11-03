# Notoria - Intelligent Note & Collaboration Platform

A full-stack web application built with Node.js, Express, MongoDB, and React that serves as a productivity tool combining notes, blogs, collaboration, and task management.

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js, Mongoose, MongoDB
- **Frontend**: React.js (Vite), TailwindCSS, React Router v6, Axios
- **Admin Panel**: Vanilla JS with Vite
- **Auth**: JWT (Access + Refresh tokens) using bcrypt
- **Real-time**: Socket.IO for collaborative editing

## 📁 Project Structure

```
Notoria/
├── backend/              # Express API server
│   ├── routes/          # API routes
│   ├── models/          # MongoDB models
│   ├── middleware/      # Auth middleware
│   ├── config/          # Database config
│   └── server.js        # Entry point
│
├── student-frontend/     # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
│   └── package.json
│
└── admin-frontend/       # Admin dashboard
    ├── app/             # Admin app files
    └── index.html
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGO_URI=mongodb://localhost:27017/notoria
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Student Frontend Setup

1. Navigate to student-frontend directory:
```bash
cd student-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Admin Frontend Setup

1. Navigate to admin-frontend directory:
```bash
cd admin-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The admin panel will run on `http://localhost:5174`

## 📝 Features

### User Features
- ✅ User registration and authentication (JWT)
- ✅ Create, edit, delete, and manage notes
- ✅ Real-time collaborative note editing
- ✅ Create and publish public blogs
- ✅ Task management with status tracking
- ✅ Pomodoro timer widget
- ✅ Note collaboration and sharing
- ✅ Markdown support for notes

### Admin Features
- ✅ User management
- ✅ View all notes and blogs
- ✅ Analytics dashboard
- ✅ System statistics

## 🔐 Creating an Admin User

To create an admin user, you can do it directly in MongoDB or use MongoDB Compass:

1. Register a regular user through the frontend
2. Connect to MongoDB and find the user document
3. Update the `isAdmin` field to `true`

Alternatively, you can add this route temporarily in backend to create an admin:

```javascript
// Add to routes/users.js (temporary)
router.post('/create-admin', async (req, res) => {
  const { email, password } = req.body;
  // ... create user with isAdmin: true
});
```

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/refresh` - Refresh access token
- `GET /api/users/me` - Get current user

### Notes
- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/collaborators` - Add collaborator

### Blogs
- `GET /api/blogs/public` - Get public blogs
- `GET /api/blogs/my` - Get user's blogs
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog
- `POST /api/blogs/:id/like` - Like/unlike blog

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Collaboration
- `GET /api/collab/invites` - Get collaboration invites
- `POST /api/collab/share` - Share note with user
- `POST /api/collab/invites/:id/accept` - Accept invite
- `POST /api/collab/invites/:id/decline` - Decline invite

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/notes` - Get all notes
- `GET /api/admin/blogs` - Get all blogs
- `GET /api/admin/analytics` - Get analytics
- `DELETE /api/admin/users/:id` - Delete user

## 🎨 UI Features

- Clean, minimal white theme with TailwindCSS
- Responsive design
- Real-time updates with Socket.IO
- Protected routes
- Token-based authentication

## 🚢 Deployment

### Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

## 📝 Notes

- Make sure MongoDB is running before starting the backend
- Update environment variables for production
- Change JWT secrets in production
- Configure CORS properly for production deployment

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the MIT License.
