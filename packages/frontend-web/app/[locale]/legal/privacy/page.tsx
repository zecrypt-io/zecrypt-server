import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for our password manager and encrypted drive services",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Privacy Policy</h1>
      <p className="mb-8 text-gray-800 dark:text-gray-200"><strong>Effective Date:</strong> March 19, 2024</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Zero-Knowledge Architecture</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Our password manager and encrypted drive services are built upon a zero-knowledge architecture. This means that we do not have access to any of your personal information, passwords, or file contents. All encryption and decryption processes happen on your device using a master key that only you possess. We never store, access, or transmit your master key, ensuring that only you can access your data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Data Collection</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We do not collect or store raw user data. No passwords, notes, files, or sensitive information are stored in an unencrypted form on our servers. We do not engage in behavior tracking, analytics of user content, or profiling. Minimal metadata such as email address (for account registration and recovery) and timestamps may be collected strictly for operational purposes, and none of this data is linked to your encrypted content.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. Data Encryption</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          All user data is encrypted using strong cryptographic algorithms on your device before being uploaded. The encryption keys are never shared with our servers. Your files and passwords are stored in a format that is meaningless to anyone without your unique master key. End-to-end encryption ensures your data is protected in transit and at rest.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Your Control</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You retain full control over your data. Only you (and anyone you explicitly share access with) can decrypt and view the data. We cannot assist in recovering lost passwords or master keys due to the zero-knowledge nature of our platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Device Security</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          While we ensure strong security on our end, the protection of your device and master key is your responsibility. Ensure your devices are secure and free from malware to prevent unauthorized access.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Third-Party Services</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We do not use third-party analytics, advertising, or data monetization tools that access user content. Any third-party infrastructure providers used (e.g., cloud storage) only store encrypted data that is unreadable to them.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7. Policy Updates</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          We may update this Privacy Policy to reflect changes in our practices or for legal compliance. Users will be notified of any material changes. Continued use of the service after changes implies acceptance.
        </p>
      </section>
    </div>
  );
} 