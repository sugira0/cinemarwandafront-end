import './StaticPage.css';

export default function Terms() {
  return (
    <div className="static-page static-legal">
      <div className="static-hero">
        <div className="static-hero-badge">Legal</div>
        <h1>Terms of Service</h1>
        <p>Last updated: January 2025</p>
      </div>
      <div className="legal-body">
        <section><h2>1. Acceptance</h2><p>By using CINEMA Rwanda, you agree to these terms. If you do not agree, please do not use our platform.</p></section>
        <section><h2>2. Account Rules</h2><p>You must be 13 or older to create an account. You are responsible for keeping your password secure. Accounts may not be shared beyond 2 registered devices.</p></section>
        <section><h2>3. Content Policy</h2><p>Authors may only upload content they own or have rights to. Content must not contain hate speech, explicit material, or copyright violations. We reserve the right to remove content that violates these rules.</p></section>
        <section><h2>4. Subscriptions & Payments</h2><p>Subscription fees are non-refundable unless required by law. Subscriptions auto-expire and must be renewed manually. We reserve the right to change pricing with 30 days notice.</p></section>
        <section><h2>5. Intellectual Property</h2><p>All content uploaded by authors remains their property. By uploading, you grant CINEMA Rwanda a license to display and stream your content on our platform.</p></section>
        <section><h2>6. Termination</h2><p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time from your account settings.</p></section>
        <section><h2>7. Contact</h2><p>Questions about these terms? Contact us at <a href="/contact">our contact page</a>.</p></section>
      </div>
    </div>
  );
}
