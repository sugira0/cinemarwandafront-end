import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import './StaticPage.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    // In production connect to a real email service
    setSent(true);
  };

  return (
    <div className="static-page">
      <div className="static-hero">
        <div className="static-hero-badge">Contact</div>
        <h1>Get in Touch</h1>
        <p>Have a question, partnership idea, or need support? We'd love to hear from you.</p>
      </div>

      <div className="contact-layout">
        <div className="contact-info">
          <div className="contact-item"><Mail size={18} strokeWidth={1.5} /><div><strong>Email</strong><span>hello@cinemarwanda.rw</span></div></div>
          <div className="contact-item"><Phone size={18} strokeWidth={1.5} /><div><strong>Phone</strong><span>+250 788 000 000</span></div></div>
          <div className="contact-item"><MapPin size={18} strokeWidth={1.5} /><div><strong>Location</strong><span>Kigali, Rwanda</span></div></div>
        </div>

        {sent ? (
          <div className="contact-success">
            <Send size={32} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
            <h3>Message sent!</h3>
            <p>We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="cf-row">
              <div className="cf-field"><label>Name</label><input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="cf-field"><label>Email</label><input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div className="cf-field"><label>Subject</label><input placeholder="How can we help?" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="cf-field"><label>Message</label><textarea placeholder="Tell us more..." rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required /></div>
            <button type="submit" className="static-btn"><Send size={15} strokeWidth={2} /> Send Message</button>
          </form>
        )}
      </div>
    </div>
  );
}
