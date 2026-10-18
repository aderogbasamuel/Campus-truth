import { createFileRoute } from "@tanstack/react-router";
import LegalLayout from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/terms")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The rules and responsibilities that apply when you use CampusTruth."
      updated="October 18, 2026"
    >
      <p>
        Welcome to CampusTruth. These Terms of Service ("Terms") govern your
        access to and use of CampusTruth, including our campus information
        platform, student discussions, communities, and AI Campus Assistant.
      </p>

      <p>
        By creating an account or using CampusTruth, you agree to these Terms.
        If you do not agree, do not use the service.
      </p>

      <h2>1. About CampusTruth</h2>
      <p>
        CampusTruth helps students discover campus information, share
        knowledge, ask questions, participate in communities, and access
        AI-assisted answers. We aim to make campus information easier to find
        and evaluate.
      </p>
      <p>
        CampusTruth is not itself a university authority and does not
        automatically endorse every post, answer, or statement published
        by a user. Unless explicitly identified as official or verified,
        content should not be treated as an official university announcement.
      </p>

      <h2>2. Eligibility and Accounts</h2>
      <p>
        You must be legally permitted to use the service in your location
        and provide accurate information when creating an account. You are
        responsible for maintaining the security of your account and for
        activity carried out through it.
      </p>
      <p>
        Do not impersonate another person, create an account using information
        you are not authorized to use, or misrepresent your affiliation with
        a university or organization.
      </p>
      <p>
        If you believe someone has accessed your account without permission,
        take reasonable steps to secure it and contact CampusTruth.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>You agree not to use CampusTruth to:</p>
      <ul>
        <li>Harass, threaten, bully, or deliberately intimidate others.</li>
        <li>Publish unlawful, defamatory, fraudulent, or deliberately deceptive content.</li>
        <li>Share another person's private information without authorization.</li>
        <li>Impersonate students, university staff, or official institutions.</li>
        <li>Upload content that infringes another person's intellectual property rights.</li>
        <li>Spam users, manipulate discussions, or abuse platform features.</li>
        <li>Attempt to bypass security controls or access restricted data.</li>
        <li>Interfere with the platform, its infrastructure, or other users' access.</li>
        <li>Use the platform for any purpose prohibited by applicable law.</li>
      </ul>

      <h2>4. Posts, Questions, and User Content</h2>
      <p>
        You retain ownership of content you create, subject to rights that
        already belong to others. You are responsible for ensuring that you
        have the rights and permissions needed to publish your content.
      </p>
      <p>
        By submitting content, you grant CampusTruth a non-exclusive,
        worldwide, royalty-free license to host, store, reproduce, display,
        and distribute that content as reasonably necessary to operate,
        maintain, secure, and improve the platform and the features you use.
        This license lasts only as long as necessary for those purposes,
        subject to applicable law and legitimate retention needs.
      </p>
      <p>
        Your content may be visible to other users based on where you publish
        it and the privacy controls available for that feature. Do not publish
        content you expect to remain private in a public feed or community.
      </p>
      <p>
        You must not post private academic records, personal contact details,
        or other sensitive information about another person without a lawful
        basis and appropriate authorization.
      </p>

      <h2>5. Accuracy and Campus Information</h2>
      <p>
        We work toward making campus information useful and trustworthy, but
        we cannot guarantee that every user post, answer, announcement, or
        external source is complete, accurate, current, or authentic.
      </p>
      <p>
        For important decisions involving admissions, examinations, fees,
        deadlines, academic standing, or university requirements, verify
        information with the relevant official university source.
      </p>
      <p>
        Users must not deliberately misrepresent rumors or fabricated
        announcements as confirmed official information.
      </p>

      <h2>6. AI Campus Assistant</h2>
      <p>
        The CampusTruth AI Campus Assistant generates responses based on the
        prompt, available context, and the AI services used by the platform.
        AI-generated answers may be inaccurate, incomplete, outdated, or
        misleading.
      </p>
      <ul>
        <li>
          Verify important answers with official university sources.
        </li>
        <li>
          Do not treat AI responses as official university decisions or
          professional legal, medical, or financial advice.
        </li>
        <li>
          Do not rely on AI responses as the sole basis for high-impact
          academic or personal decisions.
        </li>
        <li>
          Do not use the assistant to generate content that violates these
          Terms or applicable law.
        </li>
      </ul>
      <p>
        AI availability, response quality, usage limits, and credit
        requirements may change as the service develops. Any displayed
        credit costs or limits apply to the relevant feature at the time
        of use.
      </p>

      <h2>7. Communities and Moderation</h2>
      <p>
        Community participation must remain respectful and comply with these
        Terms. Community administrators and CampusTruth moderators may review
        reported content and take action where necessary to protect users
        and the platform.
      </p>
      <p>
        We may remove or restrict content, limit functionality, or suspend
        accounts when we reasonably believe there has been a violation of
        these Terms, a security risk, or a legal requirement. Where
        appropriate and practicable, we may provide notice or an opportunity
        to appeal.
      </p>
      <p>
        You may use available reporting features to flag content you believe
        is abusive, misleading, unlawful, or otherwise inappropriate.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        CampusTruth's name, branding, interface, software, and original
        materials are owned by or licensed to their respective rights
        holders and are protected by applicable law.
      </p>
      <p>
        Except as permitted by law or with authorization, you may not copy,
        redistribute, modify, sell, or commercially exploit protected
        parts of CampusTruth. These Terms do not transfer ownership of
        CampusTruth's intellectual property to you.
      </p>

      <h2>9. Third-Party Services</h2>
      <p>
        CampusTruth may rely on third-party services for authentication,
        hosting, storage, AI processing, and other functionality. Those
        services may have their own terms, privacy policies, availability
        limits, and operational requirements.
      </p>
      <p>
        We are not responsible for independent third-party services to the
        extent permitted by applicable law. Your use of those services may
        be subject to their own terms.
      </p>

      <h2>10. Service Availability and Changes</h2>
      <p>
        CampusTruth is an evolving platform. We may add, change, suspend,
        or discontinue features to maintain, secure, or improve the service.
        We will make reasonable efforts to communicate material changes
        where appropriate.
      </p>
      <p>
        We do not guarantee uninterrupted access or that every feature will
        always be available or error-free.
      </p>

      <h2>11. Suspension and Account Termination</h2>
      <p>
        You may stop using CampusTruth and request account deletion through
        the available in-app controls. Some information may be retained where
        required or permitted by law, as described in our Privacy Policy.
      </p>
      <p>
        We may suspend or terminate access where necessary to enforce these
        Terms, address security or safety concerns, comply with legal
        obligations, or protect CampusTruth and its users.
      </p>

      <h2>12. Disclaimers</h2>
      <p>
        To the extent permitted by applicable law, CampusTruth is provided
        on an "as available" basis. We do not warrant that the platform will
        always be uninterrupted, error-free, or free from inaccurate content.
      </p>
      <p>
        Nothing in these Terms excludes or limits any consumer or other
        legal rights that cannot lawfully be excluded or limited.
      </p>

      <h2>13. Limitation of Liability</h2>
      <p>
        To the extent permitted by applicable law, CampusTruth will not be
        liable for indirect or consequential losses arising from use of the
        platform, reliance on user-generated or AI-generated content, or
        temporary service interruptions.
      </p>
      <p>
        This section does not exclude liability where exclusion is prohibited
        by law, including liability that cannot legally be limited.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms as CampusTruth evolves or legal requirements
        change. We will update the date at the top of this page when revisions
        are published. Where required, we will provide notice or obtain
        additional consent.
      </p>
        <h2>15. Governing Law</h2>
      <p>
        These Terms are subject to applicable laws. Any governing-law or
        dispute-resolution provisions will be interpreted consistently with
        mandatory legal protections that apply to you.
      </p>

      <h2>16. Contact</h2>
      <p>
        If you have questions about these Terms, contact the CampusTruth team
        using the support email linked on this page.
      </p>
    </LegalLayout>
  );
}