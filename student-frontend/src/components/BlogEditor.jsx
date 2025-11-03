import { useState, useEffect } from 'react';
import api from '../services/api';

const BlogEditor = ({ blog, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blog) {
      setTitle(blog.title || '');
      setContent(blog.content || '');
      setTags(blog.tags?.join(', ') || '');
      setIsPublic(blog.isPublic || false);
    }
  }, [blog]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const blogData = {
        title,
        content,
        tags: tagsArray,
        isPublic,
      };

      let response;
      if (blog?._id) {
        response = await api.put(`/blogs/${blog._id}`, blogData);
      } else {
        response = await api.post('/blogs', blogData);
      }

      onSave(response.data);
    } catch (error) {
      console.error('Error saving blog:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        {blog ? 'Edit Blog' : 'New Blog'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content (HTML/Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            placeholder="Write your blog content here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="tech, programming, web"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
            Make this blog public
          </label>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : blog ? 'Update' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;
