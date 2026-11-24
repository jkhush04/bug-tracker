import { useEffect, useState } from 'react';
import { commentApi } from '../api/commentApi';
import { useAuth } from '../hooks/useAuth';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function CommentSection({ issueId, project, onCountChange }) {
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await commentApi.getComments(issueId);
        if (!cancelled) setComments(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load comments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content) return;

    setPosting(true);
    setError('');
    try {
      const created = await commentApi.addComment(issueId, content);
      const updated = [...comments, created];
      setComments(updated);
      setNewContent('');
      onCountChange?.(updated.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId) => {
    const content = editContent.trim();
    if (!content) return;

    setSavingEdit(true);
    setError('');
    try {
      const saved = await commentApi.updateComment(commentId, content);
      setComments((prev) => prev.map((c) => (c.id === commentId ? saved : c)));
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update comment');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    setError('');
    try {
      await commentApi.deleteComment(commentId);
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      onCountChange?.(updated.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const isProjectOwner = project?.owner?.id === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="mb-3 text-sm font-bold text-gray-800">Comments ({comments.length})</h4>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
          No comments yet. Start the discussion below.
        </p>
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => {
            const isAuthor = c.author?.id === user?.id;
            const canDelete = isAuthor || isProjectOwner || isAdmin;
            const edited = new Date(c.updatedAt) - new Date(c.createdAt) > 1000;
            const isEditing = editingId === c.id;

            return (
              <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-semibold text-gray-800">{c.author?.name}</span>
                    <span className="ml-2 text-gray-400">{timeAgo(c.createdAt)}</span>
                    {edited && <span className="ml-1 text-gray-400">(edited)</span>}
                  </div>

                  {!isEditing && (isAuthor || canDelete) && (
                    <div className="flex gap-2 text-xs">
                      {isAuthor && (
                        <button
                          onClick={() => startEdit(c)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(c.id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingEdit ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{c.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd}>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={3}
          placeholder="Write a comment..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={posting || !newContent.trim()}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </form>
    </div>
  );
}