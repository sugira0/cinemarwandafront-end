import './StaticPage.css';

export default function Privacy() {
  return (
    <div className="static-page static-legal">
      <div className="static-hero">
        <div className="static-hero-badge">Legal</div>
        <h1>Privacy Policy</h1>
        <p>Last updated: January 2025</p>
      </div>
      <div className="legal-body">
        <section><h2>1. Information We Collect</h2><p>We collect information you provide when creating an account (name, email, password), content you upload (films, photos), and usage data (views, watchlist, reviews).</p></section>
        <section><h2>2. How We Use Your Information</h2><p>We use your information to provide and improve our services, send notifications about your account and content, process payments, and communicate with you about platform updates.</p></section>
        <section><h2>3. Data Storage</h2><p>Your data is stored securely on our servers in Rwanda. We use industry-standard encryption and security practices to protect your information.</p></section>
        <section><h2>4. Device Tracking</h2><p>We track registered devices to enforce our 2-device limit per account. Device IDs are stored securely and used only for account security purposes.</p></section>
        <section><h2>5. Third-Party Services</h2><p>We may use third-party services for payment processing and email delivery. These services have their own privacy policies.</p></section>
        <section><h2>6. Your Rights</h2><p>You may request deletion of your account and data at any time by contacting us at hello@cinemarwanda.rw.</p></section>
        <section><h2>7. Contact</h2><p>For privacy concerns, contact us at hello@cinemarwanda.rw or visit our <a href="/contact">Contact page</a>.</p></section>
      </div>
    </div>
  );
}
