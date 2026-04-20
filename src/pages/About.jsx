import { Film, Users, Eye, Heart } from 'lucide-react';
import './StaticPage.css';

export default function About() {
  return (
    <div className="static-page">
      <div className="static-hero">
        <div className="static-hero-badge">About Us</div>
        <h1>The Home of Rwandan Cinema</h1>
        <p>CINEMA Rwanda is a streaming platform dedicated to showcasing the best of Rwandan film — from drama and action to documentary and comedy.</p>
      </div>

      <div className="static-stats">
        <div className="static-stat"><Film size={24} strokeWidth={1.5} /><span className="ss-num">50+</span><span className="ss-label">Films</span></div>
        <div className="static-stat"><Users size={24} strokeWidth={1.5} /><span className="ss-num">1K+</span><span className="ss-label">Users</span></div>
        <div className="static-stat"><Eye size={24} strokeWidth={1.5} /><span className="ss-num">10K+</span><span className="ss-label">Views</span></div>
        <div className="static-stat"><Heart size={24} strokeWidth={1.5} /><span className="ss-num">100%</span><span className="ss-label">Rwandan</span></div>
      </div>

      <div className="static-section">
        <h2>Our Mission</h2>
        <p>We believe Rwandan stories deserve a global stage. Our mission is to connect local filmmakers with audiences worldwide, support the growth of Rwanda's creative industry, and preserve our cultural heritage through film.</p>
      </div>

      <div className="static-section">
        <h2>For Filmmakers</h2>
        <p>Are you a Rwandan filmmaker? Register as an Author on our platform and upload your films directly. Reach thousands of viewers, track your audience, and grow your career.</p>
        <a href="/register" className="static-btn">Start Uploading →</a>
      </div>

      <div className="static-section">
        <h2>For Viewers</h2>
        <p>Discover incredible Rwandan films across every genre. Create a free account to save your watchlist, leave reviews, and follow your favourite actors and filmmakers.</p>
        <a href="/register" className="static-btn">Join Free →</a>
      </div>
    </div>
  );
}
