import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for using Zecrypt",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Terms and Conditions</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Zecrypt, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zecrypt provides a secure platform for storing and managing sensitive information. Our service includes encryption, secure storage, and access management features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">3. User Obligations</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  As a user of Zecrypt, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account</li>
                  <li>Use the service in compliance with applicable laws</li>
                  <li>Not attempt to breach our security measures</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">4. Data Ownership</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain all rights to your data. We do not claim ownership of any information you store using our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">5. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                While we strive to maintain high availability, we do not guarantee uninterrupted service. We reserve the right to perform maintenance and updates as needed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">6. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate or suspend access to our service for violations of these terms or for any other reason at our discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zecrypt is provided "as is" without any warranties. We are not liable for any damages arising from the use or inability to use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-primary">8. Modifications to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 