import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions for using Zecrypt",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Terms and Conditions</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          By accessing and using Zecrypt, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Service Description</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Zecrypt provides a secure platform for storing and managing sensitive information. Our service includes encryption, secure storage, and access management features.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. User Obligations</h2>
        <div className="space-y-4 mb-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            As a user of Zecrypt, you agree to:
          </p>
          <ul className="list-disc pl-8 space-y-3 text-gray-600 dark:text-gray-400">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Use the service in compliance with applicable laws</li>
            <li>Not attempt to breach our security measures</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Data Ownership</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You retain all rights to your data. We do not claim ownership of any information you store using our service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Service Availability</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          While we strive to maintain high availability, we do not guarantee uninterrupted service. We reserve the right to perform maintenance and updates as needed.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Termination</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We reserve the right to terminate or suspend access to our service for violations of these terms or for any other reason at our discretion.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7. Limitation of Liability</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Zecrypt is provided "as is" without any warranties. We are not liable for any damages arising from the use or inability to use our service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">8. Modifications to Terms</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
        </p>
      </section>

      <div className="mt-8 text-sm text-muted-foreground dark:text-gray-400 text-center">
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
} 