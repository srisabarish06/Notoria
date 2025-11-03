import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PublicBlogs from './pages/PublicBlogs';
import MyTasks from './pages/MyTasks';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    return user ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        {user && <Navbar user={user} setUser={setUser} />}
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" />
              ) : (
                <Login setUser={setUser} />
              )
            }
          />
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/" />
              ) : (
                <Register setUser={setUser} />
              )
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs"
            element={
              <ProtectedRoute>
                <PublicBlogs user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <MyTasks user={user} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
