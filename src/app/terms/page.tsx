import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Clipcast",
  description:
    "Terms of Service for Clipcast - Read the terms governing your use of our service.",
};

export default function TermsOfService() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16 prose prose-gray prose-sm sm:prose-base">
        <h1>Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: February 22, 2026</p>

        <h2>Agreement to Terms</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) constitute a legally
          binding agreement between you (&quot;you&quot; or &quot;your&quot;)
          and Clipcast (&quot;Clipcast,&quot;
          &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your
          access to and use of the website located at{" "}
          <a href="https://clipcast.io">https://clipcast.io</a> and any
          related services, features, content, or applications offered by
          Clipcast (collectively, the &quot;Services&quot;).
        </p>
        <p>
          By accessing or using our Services, you agree that you have read,
          understood, and agree to be bound by these Terms. If you do not
          agree with these Terms, you must not access or use the Services.
        </p>
        <p>
          We reserve the right to update or modify these Terms at any time.
          When we do, we will notify you by email and/or by posting a notice
          on the Services prior to the change becoming effective. Your
          continued use of the Services after such modifications constitutes
          your acceptance of the updated Terms. We encourage you to review
          these Terms periodically.
        </p>

        <hr />

        <h2>Table of Contents</h2>
        <ol>
          <li><a href="#eligibility">Eligibility</a></li>
          <li><a href="#account">Account Registration</a></li>
          <li><a href="#services">Description of Services</a></li>
          <li><a href="#subscriptions">Subscriptions and Payments</a></li>
          <li><a href="#free-trial">Free Clips and Trials</a></li>
          <li><a href="#user-content">User Content</a></li>
          <li><a href="#ai-content">AI-Generated Content</a></li>
          <li><a href="#prohibited">Prohibited Uses</a></li>
          <li><a href="#ip">Intellectual Property</a></li>
          <li><a href="#third-party">Third-Party Services</a></li>
          <li><a href="#termination">Termination</a></li>
          <li><a href="#disclaimers">Disclaimers</a></li>
          <li><a href="#liability">Limitation of Liability</a></li>
          <li><a href="#indemnification">Indemnification</a></li>
          <li><a href="#disputes">Dispute Resolution</a></li>
          <li><a href="#general">General Provisions</a></li>
          <li><a href="#contact">Contact Us</a></li>
        </ol>

        <hr />

        <h2 id="eligibility">1. Eligibility</h2>
        <p>
          You must be at least 18 years of age, or the age of legal majority
          in your jurisdiction (whichever is greater), to use the Services. By
          using the Services, you represent and warrant that you meet this
          eligibility requirement. If you are using the Services on behalf of
          a business or other legal entity, you represent that you have the
          authority to bind that entity to these Terms.
        </p>

        <h2 id="account">2. Account Registration</h2>
        <p>
          To access certain features of the Services, you must create an
          account. You may register using your email address or through a
          third-party authentication provider such as Google Sign-In. When
          creating an account, you agree to:
        </p>
        <ul>
          <li>
            Provide accurate, current, and complete information during the
            registration process
          </li>
          <li>
            Maintain and promptly update your account information to keep it
            accurate, current, and complete
          </li>
          <li>
            Maintain the security and confidentiality of your login
            credentials and not share them with any third party
          </li>
          <li>
            Accept responsibility for all activities that occur under your
            account
          </li>
          <li>
            Notify us immediately if you suspect any unauthorized use of your
            account
          </li>
        </ul>
        <p>
          We reserve the right to suspend or terminate your account at any
          time if we reasonably believe that you have violated these Terms or
          if required by law.
        </p>

        <h2 id="services">3. Description of Services</h2>
        <p>
          Clipcast is a web application that allows users to upload podcast
          audio files and automatically generate short video clips with
          captions for social media. The Services use artificial intelligence
          to:
        </p>
        <ul>
          <li>Transcribe uploaded audio files</li>
          <li>
            Identify compelling or viral-worthy moments within the audio
          </li>
          <li>
            Generate vertical (9:16) video clips with animated captions,
            suitable for platforms such as TikTok, Instagram Reels, and
            YouTube Shorts
          </li>
        </ul>
        <p>
          We reserve the right to modify, suspend, or discontinue any part of
          the Services at any time, with or without notice. We will not be
          liable to you or any third party for any modification, suspension,
          or discontinuation of the Services.
        </p>

        <h2 id="subscriptions">4. Subscriptions and Payments</h2>
        <h3>Pricing and Plans</h3>
        <p>
          Clipcast offers both free and paid subscription plans. The features,
          limitations, and pricing of each plan are described on our website
          and may be updated from time to time. Current pricing is available
          at{" "}
          <a href="https://clipcast.io">https://clipcast.io</a>.
        </p>

        <h3>Billing</h3>
        <p>
          If you choose a paid subscription, you agree to pay the applicable
          fees as described at the time of purchase. All payments are
          processed through our third-party payment processor,{" "}
          <strong>Stripe</strong>. By providing your payment information, you
          authorize us (via Stripe) to charge the applicable fees to your
          designated payment method on a recurring basis according to your
          selected billing cycle.
        </p>

        <h3>Automatic Renewal</h3>
        <p>
          Paid subscriptions automatically renew at the end of each billing
          cycle unless you cancel before the renewal date. You may cancel your
          subscription at any time through your account settings. Cancellation
          will take effect at the end of the current billing period, and you
          will retain access to paid features until that date.
        </p>

        <h3>Refunds</h3>
        <p>
          Payments are generally non-refundable, except where required by
          applicable law. If you believe you have been charged in error,
          please contact us at{" "}
          <a href="mailto:garyliang.cpp@gmail.com">garyliang.cpp@gmail.com</a>{" "}
          within 14 days of the charge.
        </p>

        <h3>Price Changes</h3>
        <p>
          We reserve the right to change our pricing at any time. If we
          change the pricing for your subscription plan, we will notify you at
          least 30 days before the change takes effect. Your continued use of
          the Services after the price change constitutes your agreement to
          the new pricing.
        </p>

        <h2 id="free-trial">5. Free Clips and Trials</h2>
        <p>
          We may offer a limited number of free clips or a free trial period
          to new users. The terms, duration, and limitations of any free
          offering will be described at the time it is made available. We
          reserve the right to modify or discontinue free offerings at any
          time without notice. Abuse of free offerings (such as creating
          multiple accounts to circumvent limits) is prohibited and may result
          in account termination.
        </p>

        <h2 id="user-content">6. User Content</h2>
        <h3>Your Content</h3>
        <p>
          &quot;User Content&quot; refers to any audio files, text, images, or
          other materials you upload, submit, or otherwise make available
          through the Services. You retain all ownership rights in your User
          Content.
        </p>

        <h3>License Grant</h3>
        <p>
          By uploading User Content to the Services, you grant Clipcast a
          non-exclusive, worldwide, royalty-free, sublicensable license to
          use, process, store, and transmit your User Content solely for the
          purpose of providing and improving the Services. This license
          includes the right to send your audio content to third-party AI
          service providers (such as OpenAI and Anthropic) for transcription
          and analysis. This license terminates when you delete your User
          Content or your account, except to the extent required for backup,
          archival, or legal compliance purposes.
        </p>

        <h3>Your Responsibilities</h3>
        <p>You represent and warrant that:</p>
        <ul>
          <li>
            You own or have the necessary rights, licenses, and permissions to
            upload and use your User Content through the Services
          </li>
          <li>
            Your User Content does not infringe, misappropriate, or violate
            any third party&apos;s intellectual property rights, privacy rights,
            or other legal rights
          </li>
          <li>
            Your User Content complies with all applicable laws and
            regulations
          </li>
          <li>
            You have obtained all necessary consents from any individuals
            whose voices or personal information appear in your uploaded audio
            files
          </li>
        </ul>

        <h3>Content Removal</h3>
        <p>
          We reserve the right (but have no obligation) to review, refuse, or
          remove any User Content at our sole discretion, including content
          that we believe violates these Terms or may be harmful, offensive,
          or otherwise objectionable.
        </p>

        <h2 id="ai-content">7. AI-Generated Content</h2>
        <h3>Nature of AI Output</h3>
        <p>
          The Services use artificial intelligence to transcribe audio,
          identify clip-worthy moments, and generate video clips. You
          acknowledge and agree that:
        </p>
        <ul>
          <li>
            AI-generated transcriptions may contain errors or inaccuracies.
            You are responsible for reviewing all output for accuracy before
            publishing or distributing it.
          </li>
          <li>
            The selection of &quot;viral-worthy&quot; or compelling moments is
            based on AI analysis and may not align with your preferences or
            expectations. The AI&apos;s judgment is suggestive, not definitive.
          </li>
          <li>
            AI-generated captions and video outputs are provided &quot;as
            is.&quot; We do not guarantee the quality, accuracy, or
            suitability of any AI-generated content for any particular
            purpose.
          </li>
        </ul>

        <h3>Ownership of Output</h3>
        <p>
          Subject to your ownership of the underlying User Content, you own
          the video clips and other outputs generated by the Services from
          your User Content. You are free to use, distribute, and monetize
          these outputs as you see fit, subject to applicable law and the
          rights of any third parties.
        </p>

        <h3>AI Service Provider Terms</h3>
        <p>
          Our AI features are powered by third-party providers, including
          OpenAI and Anthropic. Your use of the Services is also subject to
          the terms and policies of these providers. You must not use the
          Services in any way that would violate the terms of our AI service
          providers.
        </p>

        <h2 id="prohibited">8. Prohibited Uses</h2>
        <p>
          You agree not to use the Services to:
        </p>
        <ul>
          <li>
            Upload, transmit, or distribute content that is unlawful,
            harmful, threatening, abusive, harassing, defamatory, vulgar,
            obscene, or otherwise objectionable
          </li>
          <li>
            Upload content that infringes any patent, trademark, copyright,
            trade secret, or other intellectual property or proprietary right
            of any party
          </li>
          <li>
            Upload content containing the personal information of others
            without their consent
          </li>
          <li>
            Impersonate any person or entity, or falsely state or
            misrepresent your affiliation with a person or entity
          </li>
          <li>
            Interfere with or disrupt the Services or servers or networks
            connected to the Services
          </li>
          <li>
            Attempt to gain unauthorized access to any portion of the
            Services, other accounts, computer systems, or networks connected
            to the Services
          </li>
          <li>
            Use any automated means (including bots, scrapers, or crawlers)
            to access or interact with the Services, except as expressly
            permitted by us
          </li>
          <li>
            Circumvent, disable, or otherwise interfere with security-related
            features of the Services, including features that prevent or
            restrict use or copying of any content or enforce limitations on
            use of the Services
          </li>
          <li>
            Use the Services to generate, distribute, or promote spam,
            malware, or phishing content
          </li>
          <li>
            Create multiple accounts to abuse free tier limits or
            promotional offers
          </li>
          <li>
            Resell, redistribute, or sublicense access to the Services
            without our prior written consent
          </li>
          <li>
            Use the Services in any manner that could damage, disable,
            overburden, or impair the Services or interfere with any other
            party&apos;s use of the Services
          </li>
        </ul>

        <h2 id="ip">9. Intellectual Property</h2>
        <h3>Our Intellectual Property</h3>
        <p>
          The Services and their original content (excluding User Content),
          features, and functionality are and will remain the exclusive
          property of Clipcast and its licensors. The Services are protected
          by copyright, trademark, and other laws of the United States and
          foreign countries. Our trademarks and trade dress may not be used in
          connection with any product or service without the prior written
          consent of Clipcast.
        </p>

        <h3>Feedback</h3>
        <p>
          If you provide us with any feedback, suggestions, or ideas
          regarding the Services (&quot;Feedback&quot;), you assign to us all
          rights in such Feedback and agree that we are free to use,
          disclose, reproduce, license, or otherwise distribute and exploit
          the Feedback without any obligation to you.
        </p>

        <h2 id="third-party">10. Third-Party Services</h2>
        <p>
          The Services may contain links to or integrations with third-party
          websites, services, or resources, including but not limited to:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> for payment processing
          </li>
          <li>
            <strong>Google Sign-In</strong> and <strong>Clerk</strong> for
            authentication
          </li>
          <li>
            <strong>OpenAI</strong> and <strong>Anthropic</strong> for AI
            processing
          </li>
          <li>
            <strong>Cloudflare</strong> for cloud computing and storage
          </li>
          <li>
            <strong>Vercel</strong> for website hosting
          </li>
        </ul>
        <p>
          We are not responsible for the availability, accuracy, or content of
          any third-party services. Your use of third-party services is at
          your own risk and subject to the terms and conditions of those third
          parties.
        </p>

        <h2 id="termination">11. Termination</h2>
        <h3>Termination by You</h3>
        <p>
          You may terminate your account at any time by contacting us at{" "}
          <a href="mailto:garyliang.cpp@gmail.com">garyliang.cpp@gmail.com</a>{" "}
          or through your account settings. If you have an active paid
          subscription, cancellation will take effect at the end of the
          current billing period.
        </p>

        <h3>Termination by Us</h3>
        <p>
          We may suspend or terminate your account and access to the Services
          at any time, with or without cause, and with or without notice. This
          includes, but is not limited to, situations where:
        </p>
        <ul>
          <li>You breach any provision of these Terms</li>
          <li>
            We are required to do so by law or a government or regulatory
            authority
          </li>
          <li>
            Your use of the Services poses a security risk or may cause harm
            to us, other users, or third parties
          </li>
          <li>Your account has been inactive for an extended period</li>
        </ul>

        <h3>Effect of Termination</h3>
        <p>
          Upon termination, your right to use the Services will immediately
          cease. We may delete your account data, including User Content and
          generated clips, after a reasonable period following termination.
          Any provisions of these Terms that by their nature should survive
          termination will survive, including but not limited to: intellectual
          property provisions, warranty disclaimers, limitation of liability,
          indemnification, and dispute resolution.
        </p>

        <h2 id="disclaimers">12. Disclaimers</h2>
        <p>
          THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER
          EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE
          LAW, CLIPCAST DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
          INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p>
          WITHOUT LIMITING THE FOREGOING, CLIPCAST DOES NOT WARRANT THAT:
        </p>
        <ul>
          <li>
            The Services will be uninterrupted, timely, secure, or
            error-free
          </li>
          <li>
            The results obtained from the use of the Services (including
            AI-generated transcriptions, clip selections, and video outputs)
            will be accurate, reliable, or meet your requirements
          </li>
          <li>
            Any errors in the Services will be corrected
          </li>
          <li>
            The Services will be free of viruses or other harmful components
          </li>
        </ul>
        <p>
          You acknowledge that you use the Services at your sole risk and
          that you are solely responsible for reviewing all AI-generated
          output for accuracy before publishing or distributing it.
        </p>

        <h2 id="liability">13. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
          SHALL CLIPCAST, ITS OWNER, AFFILIATES, LICENSORS, OR SERVICE
          PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
          LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES,
          RESULTING FROM:
        </p>
        <ul>
          <li>
            Your access to or use of (or inability to access or use) the
            Services
          </li>
          <li>
            Any conduct or content of any third party on the Services
          </li>
          <li>
            Any content obtained from the Services, including AI-generated
            content
          </li>
          <li>
            Unauthorized access, use, or alteration of your transmissions or
            content
          </li>
          <li>
            Errors, inaccuracies, or omissions in AI-generated
            transcriptions, clip selections, or video outputs
          </li>
        </ul>
        <p>
          IN NO EVENT SHALL CLIPCAST&apos;S TOTAL AGGREGATE LIABILITY FOR ALL
          CLAIMS RELATED TO THE SERVICES EXCEED THE GREATER OF: (A) THE
          AMOUNT YOU HAVE PAID TO CLIPCAST IN THE TWELVE (12) MONTHS
          PRECEDING THE EVENT GIVING RISE TO THE LIABILITY, OR (B) ONE
          HUNDRED DOLLARS ($100.00 USD).
        </p>
        <p>
          SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF
          CERTAIN DAMAGES, SO SOME OR ALL OF THE ABOVE LIMITATIONS AND
          EXCLUSIONS MAY NOT APPLY TO YOU.
        </p>

        <h2 id="indemnification">14. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Clipcast, its
          owner, affiliates, licensors, and service providers from and
          against any claims, liabilities, damages, judgments, awards, losses,
          costs, expenses, or fees (including reasonable attorneys&apos; fees)
          arising out of or relating to:
        </p>
        <ul>
          <li>Your violation of these Terms</li>
          <li>
            Your User Content, including any claim that your User Content
            infringes the intellectual property rights or other rights of a
            third party
          </li>
          <li>
            Your use of the Services in a manner not authorized by these
            Terms
          </li>
          <li>Your violation of any applicable law or regulation</li>
        </ul>

        <h2 id="disputes">15. Dispute Resolution</h2>
        <h3>Governing Law</h3>
        <p>
          These Terms and your use of the Services shall be governed by and
          construed in accordance with the laws of the State of California,
          United States, without regard to its conflict of law provisions.
        </p>

        <h3>Informal Resolution</h3>
        <p>
          Before filing any formal legal action, you agree to first contact
          us at{" "}
          <a href="mailto:garyliang.cpp@gmail.com">garyliang.cpp@gmail.com</a>{" "}
          and attempt to resolve the dispute informally. We will attempt to
          resolve the dispute by contacting you via email. If a dispute is not
          resolved within 30 days of submission, either party may proceed to
          formal dispute resolution.
        </p>

        <h3>Binding Arbitration</h3>
        <p>
          Any dispute arising from or relating to these Terms or the Services
          that cannot be resolved informally shall be resolved by binding
          arbitration conducted in Los Angeles County, California, in
          accordance with the rules of the American Arbitration Association.
          The arbitrator&apos;s decision shall be final and binding. Judgment on
          the award rendered by the arbitrator may be entered in any court
          having jurisdiction thereof.
        </p>

        <h3>Class Action Waiver</h3>
        <p>
          YOU AND CLIPCAST AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
          ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR
          CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
          Unless both you and Clipcast agree otherwise, the arbitrator may not
          consolidate or join more than one person&apos;s or party&apos;s claims and
          may not otherwise preside over any form of a consolidated,
          representative, or class proceeding.
        </p>

        <h3>Exceptions</h3>
        <p>
          Nothing in this section shall prevent either party from seeking
          injunctive or other equitable relief from the courts for matters
          related to intellectual property rights or unauthorized access to
          the Services. Additionally, claims that qualify for small claims
          court may be brought in small claims court in Los Angeles County,
          California.
        </p>

        <h2 id="general">16. General Provisions</h2>

        <h3>Entire Agreement</h3>
        <p>
          These Terms, together with our Privacy Policy available at{" "}
          <a href="https://clipcast.io/privacy">https://clipcast.io/privacy</a>
          , constitute the entire agreement between you and Clipcast regarding
          the Services and supersede all prior agreements and understandings,
          whether written or oral.
        </p>

        <h3>Severability</h3>
        <p>
          If any provision of these Terms is held to be invalid, illegal, or
          unenforceable, the remaining provisions shall continue in full force
          and effect.
        </p>

        <h3>Waiver</h3>
        <p>
          The failure of Clipcast to enforce any right or provision of these
          Terms shall not constitute a waiver of such right or provision. Any
          waiver of any provision of these Terms will be effective only if in
          writing and signed by Clipcast.
        </p>

        <h3>Assignment</h3>
        <p>
          You may not assign or transfer these Terms or your rights under
          these Terms, in whole or in part, without our prior written consent.
          We may assign or transfer these Terms, in whole or in part, without
          restriction.
        </p>

        <h3>Force Majeure</h3>
        <p>
          Clipcast shall not be liable for any failure or delay in performing
          its obligations under these Terms due to circumstances beyond its
          reasonable control, including but not limited to acts of God,
          natural disasters, war, terrorism, riots, embargoes, acts of civil
          or military authorities, fire, floods, accidents, pandemics,
          strikes, or shortages of transportation, facilities, fuel, energy,
          labor, or materials.
        </p>

        <h3>Notices</h3>
        <p>
          We may provide notices to you via email to the address associated
          with your account or by posting on the Services. You may provide
          notices to us by emailing{" "}
          <a href="mailto:garyliang.cpp@gmail.com">garyliang.cpp@gmail.com</a>.
          Notices sent by email are deemed received on the date sent.
        </p>

        <h2 id="contact">17. Contact Us</h2>
        <p>
          If you have questions or concerns about these Terms of Service,
          please contact us at:
        </p>
        <p>
          Email us at:{" "}
          <a href="mailto:garyliang.cpp@gmail.com">garyliang.cpp@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
