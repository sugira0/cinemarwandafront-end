import { useCallback, useEffect, useState } from 'react';
import { Send, Star, ThumbsUp, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import './Comments.css';

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          className={`star${value >= score ? ' filled' : ''}`}
          onClick={() => !readonly && onChange(score)}
          disabled={readonly}
        >
          <Star size={16} fill={value >= score ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

export default function Comments({ movieId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ comments: [], avgRating: 0, total: 0 });
  const [form, setForm] = useState({ text: '', rating: 0, name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadComments = useCallback(() => {
    return api.get(`/comments/${movieId}`).then((response) => setData(response.data));
  }, [movieId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submit = async (event) => {
    event.preventDefault();
    const name = user ? user.name : form.name.trim();
    if (!form.text.trim() || !name) return;

    setLoading(true);
    setError('');

    try {
      await api.post(`/comments/${movieId}`, {
        text: form.text,
        rating: form.rating,
        name,
      });
      setForm({ text: '', rating: 0, name: '' });
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to post your review right now.');
    }

    setLoading(false);
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete this review.');
    }
  };

  const likeComment = async (commentId) => {
    try {
      await api.post(`/comments/${commentId}/like`);
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this reaction.');
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h2>Reviews</h2>
        {data.avgRating > 0 && (
          <div className="avg-rating">
            <StarRating value={Math.round(data.avgRating)} readonly />
            <span>{data.avgRating} / 5 · {data.total} review{data.total !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <form className="comment-form" onSubmit={submit}>
        <div className="comment-form-top">
          <div className="comment-avatar">{user ? user.name[0] : '?'}</div>
          <div className="comment-form-fields">
            {!user && (
              <input
                placeholder="Your name *"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                className="comment-name-input"
              />
            )}
            <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
            <textarea
              placeholder="Write your review..."
              value={form.text}
              onChange={(event) => setForm({ ...form, text: event.target.value })}
              rows={3}
            />
          </div>
        </div>
        <div className="comment-form-actions">
          <button type="submit" disabled={loading || !form.text.trim() || (!user && !form.name.trim())}>
            <Send size={14} strokeWidth={2} /> {loading ? 'Posting...' : 'Post Review'}
          </button>
        </div>
        {error && <p className="detail-msg">{error}</p>}
      </form>

      <div className="comments-list">
        {data.comments.length === 0 && <p className="comments-empty">No reviews yet. Be the first!</p>}
        {data.comments.map((comment) => {
          const canDelete = (user?.id && String(user.id) === String(comment.userId)) || user?.role === 'admin';
          return (
            <div key={comment._id} className="comment-item">
              <div className="comment-avatar">{comment.name[0]}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-name">{comment.name}</span>
                  {comment.rating && <StarRating value={comment.rating} readonly />}
                  <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                  <button className="comment-like" onClick={() => likeComment(comment._id)}>
                    <ThumbsUp size={13} strokeWidth={1.5} /> {comment.likes?.length || 0}
                  </button>
                  {canDelete && (
                    <button className="comment-delete" onClick={() => deleteComment(comment._id)}>
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
