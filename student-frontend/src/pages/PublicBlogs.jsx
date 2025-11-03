import { useState, useEffect } from 'react';
import BlogEditor from '../components/BlogEditor';
import api from '../services/api';

const PublicBlogs = ({ user }) => {
  const [blogs, setBlogs] = useState([]);
  const [myBlogs, setMyBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('public');

  useEffect(() => {
    fetchPublicBlogs();
    fetchMyBlogs();
  }, []);

  const fetchPublicBlogs = async () => {
    try {
      const response = await api.get('/blogs/public');
      setBlogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setLoading(false);
    }
  };

  const fetchMyBlogs = async () => {
    try {
      const response = await api.get('/blogs/my');
      setMyBlogs(response.data);
    } catch (error) {
      console.error('Error fetching my blogs:', error);
    }
  };

  const handleBlogCreated = (newBlog) => {
    setMyBlogs([newBlog, ...myBlogs]);
    setShowEditor(false);
    setSelectedBlog(newBlog);
  };

  const handleBlogUpdated = (updatedBlog) => {
    setMyBlogs(myBlogs.map((b) => (b._id === updatedBlog._id ? updatedBlog : b)));
    setBlogs(blogs.map((b) => (b._id === updatedBlog._id ? updatedBlog : b)));
    setSelectedBlog(updatedBlog);
  };

  const handleBlogDeleted = (blogId) => {
    setMyBlogs(myBlogs.filter((b) => b._id !== blogId));
    if (selectedBlog?._id === blogId) {
      setSelectedBlog(null);
    }
    fetchPublicBlogs();
  };

  const handleLike = async (blogId) => {
    try {
      await api.post(`/blogs/${blogId}/like`);
      fetchPublicBlogs();
      if (selectedBlog?._id === blogId) {
        const response = await api.get(`/blogs/${blogId}`);
        setSelectedBlog(response.data);
      }
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };

  const displayBlogs = activeTab === 'public' ? blogs : myBlogs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
        <button
          onClick={() => {
            setShowEditor(true);
            setSelectedBlog(null);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          New Blog
        </button>
      </div>

      {showEditor ? (
        <BlogEditor
          blog={selectedBlog}
          onSave={selectedBlog ? handleBlogUpdated : handleBlogCreated}
          onCancel={() => {
            setShowEditor(false);
            setSelectedBlog(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('public')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'public'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Public
                </button>
                <button
                  onClick={() => setActiveTab('my')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'my'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  My Blogs
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-4">
                {displayBlogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No blogs found
                  </div>
                ) : (
                  displayBlogs.map((blog) => (
                    <div
                      key={blog._id}
                      onClick={() => setSelectedBlog(blog)}
                      className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                        selectedBlog?._id === blog._id
                          ? 'border-indigo-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <h3 className="font-semibold text-lg mb-2">{blog.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        By {blog.author?.username || 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{blog.views} views</span>
                        <span>{blog.likes?.length || 0} likes</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedBlog ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedBlog.title}</h2>
                    <p className="text-sm text-gray-600">
                      By {selectedBlog.author?.username} • {new Date(selectedBlog.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {user?._id === selectedBlog.author?._id && (
                    <button
                      onClick={() => {
                        setShowEditor(true);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="prose max-w-none mb-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                    className="whitespace-pre-wrap"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(selectedBlog._id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <span>👍</span>
                    <span>{selectedBlog.likes?.length || 0}</span>
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedBlog.views} views
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                Select a blog to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBlogs;
