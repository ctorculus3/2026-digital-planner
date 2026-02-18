import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Music2 } from "lucide-react";

export default function Terms() {
  useEffect(() => { document.title = "Terms of Service — Practice Daily"; }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-header-bg flex items-center justify-center">
              <Music2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Practice Daily</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 11, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Practice Daily ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Account Registration</h2>
            <p>To use Practice Daily, you must create an account with a valid email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Subscription & Billing</h2>
            <p className="mb-2">Practice Daily offers a subscription service at $3.99 per month. By subscribing, you agree to the following:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your subscription will automatically renew each month unless cancelled.</li>
              <li>You may cancel your subscription at any time through your account settings.</li>
              <li>Refunds are handled on a case-by-case basis. Please contact support for assistance.</li>
              <li>We reserve the right to change pricing with reasonable notice to subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Upload content that is offensive, harmful, or infringes on the rights of others.</li>
              <li>Attempt to gain unauthorized access to any part of the Service.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Use automated means (bots, scrapers) to access the Service without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Intellectual Property</h2>
            <p>All content, features, and functionality of Practice Daily (including but not limited to text, graphics, logos, and software) are owned by Practice Daily and are protected by copyright and other intellectual property laws. Your practice logs and uploaded content remain your property.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at our discretion if you violate these Terms of Service. Upon termination, your right to use the Service will immediately cease. We may delete your data after a reasonable retention period following account termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>Practice Daily is provided "as is" without warranties of any kind. To the fullest extent permitted by law, Practice Daily shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at <a href="mailto:support@practicedaily.app" className="text-primary hover:underline">support@practicedaily.app</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
