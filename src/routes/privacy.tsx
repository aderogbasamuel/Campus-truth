import { createFileRoute } from "@tanstack/react-router";
import LegalLayout from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How CampusTruth collects, uses, stores, and protects information when you use our campus information and community platform."
      updated="October 18, 2026"
    >
      <p>
        CampusTruth provides a platform
        that helps students discover campus information, participate in
        discussions, ask questions, connect with communities, and use an
        AI-powered campus assistant.
      </p>

      <p>
        This Privacy Policy explains how we handle information when you visit
        <a href="https://campustruth.devdrogba.me">
          {" "}campustruth.devdrogba.me
        </a>{" "}
        or use CampusTruth. Please read it carefully.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Account information</h3>
      <p>
        When you create or access an account, we may process information such
        as your email address, display name, profile information, authentication
        identifiers, and account preferences. The information available
        depends on the sign-in method and the details you provide.
      </p>

      <h3>Google sign-in information</h3>
      <p>
        If you choose to sign in with Google, Google may provide information
        permitted by the authentication permissions you approve, such as your
        email address, name, profile image, and account identifier. We use this
        information to authenticate you, associate your account with your
        CampusTruth profile, and operate the service.
      </p>

      <p>
        CampusTruth does not request access to your Google Drive, Gmail
        messages, contacts, or other Google services unless a future feature
        explicitly requires additional permissions and you are informed about
        them.
      </p>

      <h3>Content you submit</h3>
      <p>
        We process information you choose to submit, including campus posts,
        comments, questions, answers, reactions, community participation,
        profile details, reports, and saved items.
      </p>

      <p>
        Content you publish in public or community areas may be visible to
        other users according to the features and access controls of those
        areas. Do not include sensitive personal information in public posts.
      </p>

      <h3>AI assistant interactions</h3>
      <p>
        When you use the CampusTruth AI Campus Assistant, we process the
        questions and other information you submit, along with relevant
        context needed to generate a response. We may also process usage
        information required to manage AI credits and prevent abuse.
      </p>

      <p>
        Depending on the AI service configured for the feature, your prompt
        and necessary context may be sent to that service for processing.
        The applicable provider's privacy terms may also apply. We will
        identify the relevant provider in our documentation when confirmed.
        Avoid submitting passwords, financial details, or other sensitive
        information to the assistant.
      </p>

      <h3>Technical and usage information</h3>
      <p>
        Our hosting, authentication, database, and security services may
        process technical information such as IP addresses, browser and
        device information, timestamps, error logs, and activity needed to
        operate, secure, and troubleshoot the platform. The exact information
        collected depends on the services and configuration in use.
      </p>

      <h2>2. How We Use Information</h2>
      <p>We use information for purposes such as:</p>
      <ul>
        <li>Creating, authenticating, and maintaining your account.</li>
        <li>Displaying profiles and content you choose to publish.</li>
        <li>Providing campus feeds, student Q&amp;A, and communities.</li>
        <li>Generating AI assistant responses and managing AI credits.</li>
        <li>Delivering relevant notifications and service messages.</li>
        <li>Investigating reports, enforcing our rules, and preventing abuse.</li>
        <li>Maintaining security, reliability, and service performance.</li>
        <li>Meeting applicable legal obligations.</li>
      </ul>

      <h2>3. Legal Basis and Your Choices</h2>
      <p>
        Where applicable data protection law requires a legal basis, our
        processing may rely on providing the service you request, your
        consent, our legitimate interests in securing and improving the
        platform, or compliance with legal obligations. The appropriate
        basis depends on the specific processing activity.
      </p>
      <p>
        You may choose not to provide certain information. However, some
        features may not work without the information needed to provide them.
        You can also choose not to use Google sign-in or the AI assistant.
      </p>

      <h2>4. How Information Is Shared</h2>
      <p>We may share information in these limited circumstances:</p>
      <ul>
        <li>
          <strong>Service providers:</strong> Infrastructure and service
          providers that help operate authentication, databases, hosting,
          storage, notifications, or AI features.
        </li>
        <li>
          <strong>Other users:</strong> Content and profile information you
          publish or make available through platform features.
        </li>
        <li>
          <strong>Safety and legal matters:</strong> When reasonably necessary
          to address security incidents, enforce our rules, protect rights,
          or comply with valid legal requirements.
        </li>
        <li>
          <strong>Business changes:</strong> If a merger, acquisition, or
          transfer of the service occurs, subject to appropriate safeguards
          and applicable law.
        </li>
      </ul>
      <p>
        We do not sell personal information for money. We do not share Google
        user data with third parties for their own advertising purposes.
        Any future changes to these practices will be reflected in this policy
        where required.
      </p>

      <h2>5. Google User Data</h2>
      <p>
        Our use of information received through Google sign-in is limited to
        the purposes described in this policy and the permissions you grant.
        We use the information to authenticate users and support their
        CampusTruth accounts and related functionality.
      </p>
      <p>
        We do not sell Google user data or use it to build advertising
        profiles. We do not transfer Google user data to third parties except
        as necessary to provide the service, comply with law, protect against
        abuse, or as otherwise permitted by Google's applicable requirements
        and your consent.
      </p>
      <p>
        CampusTruth's use and transfer of information received from Google
        APIs will comply with the Google API Services User Data Policy,
        including its Limited Use requirements where applicable.
      </p>

      <h2>6. Data Storage and Security</h2>
      <p>
        CampusTruth uses Supabase for database and authentication functionality.
        Depending on the features in use, information may also be stored using
        hosting, file storage, and other infrastructure providers.
      </p>
      <p>
        We use appropriate technical and organizational measures intended
        to protect information from unauthorized access, alteration, loss,
        or disclosure. No online service can guarantee absolute security.
        Access to information is limited by the controls available in our
        systems and the requirements of the service.
      </p>

      <h2>7. Retention</h2>
      <p>
        We retain information for as long as reasonably necessary to provide
        the service, maintain account and transaction records, enforce our
        rules, resolve disputes, and meet legal obligations. Retention periods
        may differ by information type and purpose.
      </p>
      <p>
        Deleted content may remain temporarily in backups or logs, or where
        retention is legally required. Where information must be retained,
        we will handle it in accordance with applicable law.
      </p>

      <h2>8. Account and Data Deletion</h2>
      <p>
        You can request account deletion through the account settings or
        in-app account deletion feature when available. Follow the instructions
        shown in the application to submit your request.
      </p>
      <p>
        We will process deletion requests in accordance with applicable law
        and our operational requirements. Some information may need to be
        retained for a limited period for legal compliance, security,
        dispute resolution, or legitimate recordkeeping. We will not retain
        personal information longer than permitted for those purposes.
      </p>
      <p>
        If the in-app deletion feature is not accessible, contact our support
        team using the contact details provided on this page.
      </p>

      <h2>9. Your Privacy Rights</h2>
      <p>
        Depending on your location and applicable law, you may have the right
        to request access to your personal information, correct inaccurate
        information, request deletion, object to or restrict certain
        processing, withdraw consent where processing relies on consent,
        or request a copy of your information.
      </p>
      <p>
        To exercise a right, contact us using the support details below.
        We may need to verify your identity before responding. You may also
        have the right to complain to the relevant data protection authority.
      </p>

      <h2>10. Children's Privacy</h2>
      <p>
        CampusTruth is designed for university communities. It is not intended
        for children who are below the minimum age permitted to use the
        service under applicable law. If you believe a child has provided
        personal information inappropriately, contact us so we can review
        the situation.
      </p>

      <h2>11. International Processing</h2>
      <p>
        Our service providers may process information in countries other than
        the country where you live. Where applicable law requires safeguards
        for international transfers, we will take appropriate steps to support
        those requirements.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy as CampusTruth evolves or as legal
        requirements change. We will update the date shown at the top when
        we publish revisions. Where required, we will provide additional
        notice or obtain consent for material changes.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        For privacy questions, data requests, or concerns about Google
        sign-in data, contact the CampusTruth team using the support email
        linked on this page.
      </p>
    </LegalLayout>
  );
}