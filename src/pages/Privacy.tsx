import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Music2 } from "lucide-react";

export default function Privacy() {
  useEffect(() => { document.title = "Privacy Policy — Practice Daily"; }, []);
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
        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 11, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-2">When you use Practice Daily, we may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Your email address and display name when you create an account.</li>
              <li><strong className="text-foreground">Practice Data:</strong> Practice logs, goals, notes, audio recordings, and other content you enter into the app.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with the app, including pages visited, features used, and session duration.</li>
              <li><strong className="text-foreground">Payment Information:</strong> Subscription and billing details are processed securely through our third-party payment provider (Stripe). We do not store your full credit card number.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, maintain, and improve the Practice Daily service.</li>
              <li>To personalize your experience, including streak tracking and badge awards.</li>
              <li>To process your subscription payments.</li>
              <li>To send important service-related communications (e.g., account verification, billing updates).</li>
              <li>To respond to your support requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Data Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share data only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>With service providers who assist us in operating the app (e.g., hosting, payment processing).</li>
              <li>If required by law, regulation, or legal process.</li>
              <li>To protect the rights, safety, or property of Practice Daily, our users, or the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encryption in transit (TLS) and at rest. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Cookies</h2>
            <p>Practice Daily uses essential cookies and local storage to maintain your session and remember your preferences. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Children's Privacy</h2>
            <p>Practice Daily is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such data, we will take steps to delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date above.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@practicedaily.app" className="text-primary hover:underline">support@practicedaily.app</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
