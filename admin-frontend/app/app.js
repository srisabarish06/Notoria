import apiService from './services/apiService.js';
import * as adminCtrl from './controllers/adminCtrl.js';
import * as notesCtrl from './controllers/notesCtrl.js';
import * as blogsCtrl from './controllers/blogsCtrl.js';
import * as analyticsCtrl from './controllers/analyticsCtrl.js';

let currentUser = null;
let currentView = 'analytics';

const checkAuth = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    showLogin();
    return false;
  }
  return true;
};

const showLogin = () => {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div id="loginError" class="text-red-600 text-sm hidden"></div>
          <button
            type="submit"
            class="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('hidden');
    const result = await adminCtrl.login(email, password);

    if (result.success) {
      currentUser = result.user;
      showDashboard();
    } else {
      errorDiv.textContent = result.error;
      errorDiv.classList.remove('hidden');
    }
  });
};

const showDashboard = async () => {
  if (!checkAuth()) return;

  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Notoria Admin Panel</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-700">${currentUser?.username || 'Admin'}</span>
              <button
                id="logoutBtn"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex space-x-4 mb-6">
          <button
            id="analyticsBtn"
            class="px-4 py-2 rounded-md ${currentView === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
          >
            Analytics
          </button>
          <button
            id="usersBtn"
            class="px-4 py-2 rounded-md ${currentView === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
          >
            Users
          </button>
          <button
            id="notesBtn"
            class="px-4 py-2 rounded-md ${currentView === 'notes' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
          >
            Notes
          </button>
          <button
            id="blogsBtn"
            class="px-4 py-2 rounded-md ${currentView === 'blogs' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
          >
            Blogs
          </button>
        </div>

        <div id="content"></div>
      </div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', adminCtrl.logout);
  document.getElementById('analyticsBtn').addEventListener('click', () => {
    currentView = 'analytics';
    loadView();
  });
  document.getElementById('usersBtn').addEventListener('click', () => {
    currentView = 'users';
    loadView();
  });
  document.getElementById('notesBtn').addEventListener('click', () => {
    currentView = 'notes';
    loadView();
  });
  document.getElementById('blogsBtn').addEventListener('click', () => {
    currentView = 'blogs';
    loadView();
  });

  await loadView();
};

const loadView = async () => {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '<div class="text-center py-8">Loading...</div>';

  try {
    switch (currentView) {
      case 'analytics':
        await renderAnalytics();
        break;
      case 'users':
        await renderUsers();
        break;
      case 'notes':
        await renderNotes();
        break;
      case 'blogs':
        await renderBlogs();
        break;
    }
  } catch (error) {
    contentDiv.innerHTML = `<div class="text-red-600">Error: ${error.message}</div>`;
  }
};

const renderAnalytics = async () => {
  const result = await analyticsCtrl.fetchAnalytics();
  const contentDiv = document.getElementById('content');

  if (!result.success) {
    contentDiv.innerHTML = `<div class="text-red-600">Error: ${result.error}</div>`;
    return;
  }

  const { overview, recentActivity } = result.data;

  contentDiv.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
        <p class="text-3xl font-bold text-indigo-600">${overview.totalUsers}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Notes</h3>
        <p class="text-3xl font-bold text-indigo-600">${overview.totalNotes}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Blogs</h3>
        <p class="text-3xl font-bold text-indigo-600">${overview.totalBlogs}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Total Tasks</h3>
        <p class="text-3xl font-bold text-indigo-600">${overview.totalTasks}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Public Blogs</h3>
        <p class="text-3xl font-bold text-indigo-600">${overview.publicBlogs}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Public Notes</h3>
        <p class="text-3xl font-bold text-indigo-600">${overview.publicNotes}</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">Recent Activity (Last 7 Days)</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p class="text-sm text-gray-600">New Users</p>
          <p class="text-2xl font-bold">${recentActivity.recentUsers}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">New Notes</p>
          <p class="text-2xl font-bold">${recentActivity.recentNotes}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">New Blogs</p>
          <p class="text-2xl font-bold">${recentActivity.recentBlogs}</p>
        </div>
      </div>
    </div>
  `;
};

const renderUsers = async () => {
  const result = await apiService.getUsers();
  const contentDiv = document.getElementById('content');

  if (!result || result.error) {
    contentDiv.innerHTML = `<div class="text-red-600">Error loading users</div>`;
    return;
  }

  contentDiv.innerHTML = `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${result.map((user) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.username}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.isAdmin ? 'Yes' : 'No'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(user.createdAt).toLocaleDateString()}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${!user.isAdmin ? `<button onclick="deleteUser('${user._id}')" class="text-red-600 hover:text-red-800">Delete</button>` : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  window.deleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await apiService.deleteUser(userId);
        renderUsers();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };
};

const renderNotes = async () => {
  const result = await notesCtrl.fetchNotes();
  const contentDiv = document.getElementById('content');

  if (!result.success) {
    contentDiv.innerHTML = `<div class="text-red-600">Error: ${result.error}</div>`;
    return;
  }

  const notes = result.data;

  contentDiv.innerHTML = `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collaborators</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${notes.map((note) => `
            <tr>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">${note.title}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${note.owner?.username || 'Unknown'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${note.isPublic ? 'Yes' : 'No'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${note.collaborators?.length || 0}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${new Date(note.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

const renderBlogs = async () => {
  const result = await blogsCtrl.fetchBlogs();
  const contentDiv = document.getElementById('content');

  if (!result.success) {
    contentDiv.innerHTML = `<div class="text-red-600">Error: ${result.error}</div>`;
    return;
  }

  const blogs = result.data;

  contentDiv.innerHTML = `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${blogs.map((blog) => `
            <tr>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">${blog.title}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${blog.author?.username || 'Unknown'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${blog.isPublic ? 'Yes' : 'No'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${blog.views || 0}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${blog.likes?.length || 0}</td>
              <td class="px-6 py-4 text-sm text-gray-500">${new Date(blog.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// Initialize app
if (checkAuth()) {
  showDashboard();
} else {
  showLogin();
}
