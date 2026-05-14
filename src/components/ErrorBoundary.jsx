import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '8rem 2.5rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
          <p style={{ marginBottom: '0.5rem', color: '#fff' }}>Something went wrong.</p>
          <p style={{ fontSize: '0.85rem' }}>{this.state.error.message}</p>
          <button
            onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/login'; }}
            style={{ marginTop: '1.5rem', background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Sign out and retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
