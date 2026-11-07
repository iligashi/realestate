import { Link } from 'react-router-dom';
import InfoLayout, { Prose } from './InfoLayout';

// NOTE: Generic starting text. Have it reviewed for your jurisdiction before launch.

export const TermsPage = () => (
  <InfoLayout title="Terms of Service" updated="November 2026">
    <Prose>
      <section>
        <h2>1. Using RealEstate</h2>
        <p>
          By creating an account or using the platform you agree to these terms. You must be at least 18 years old
          and provide accurate information about yourself and any property you list.
        </p>
      </section>
      <section>
        <h2>2. Listings</h2>
        <ul>
          <li>You may only list property you own or are authorized to market.</li>
          <li>Descriptions, prices and photos must be accurate and must not mislead.</li>
          <li>We may review, edit the status of, or remove listings that break these terms.</li>
        </ul>
      </section>
      <section>
        <h2>3. Conduct</h2>
        <p>
          Do not send spam, harass other users, or use the platform for fraud. Report anything suspicious with the
          report tools on listings and conversations.
        </p>
      </section>
      <section>
        <h2>4. Transactions</h2>
        <p>
          RealEstate connects buyers, renters, sellers and agents. Agreements, payments and contracts for a property
          are made directly between those parties, who are responsible for them.
        </p>
      </section>
      <section>
        <h2>5. Accounts</h2>
        <p>
          You are responsible for keeping your password safe. We may suspend accounts that violate these terms.
        </p>
      </section>
      <section>
        <h2>6. Contact</h2>
        <p>
          Questions about these terms? <Link to="/contact" className="font-medium text-brand-600 hover:underline">Contact us</Link>.
        </p>
      </section>
    </Prose>
  </InfoLayout>
);

export const PrivacyPage = () => (
  <InfoLayout title="Privacy Policy" updated="November 2026">
    <Prose>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: name, email, phone number and role.</li>
          <li>Content you create: listings, photos, messages, viewing requests and reports.</li>
          <li>Basic usage data, such as how often a listing is viewed.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          To run the marketplace: show listings, connect you with other users, prevent abuse and improve the service.
          We do not sell your personal data.
        </p>
      </section>
      <section>
        <h2>What others can see</h2>
        <p>
          Listings and the contact details you add to them are public. Messages are visible only to the people in the
          conversation and, when a report is made, to our moderators.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can update your profile at any time and ask us to delete your account and data by contacting us.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          For privacy requests, <Link to="/contact" className="font-medium text-brand-600 hover:underline">send us a message</Link>.
        </p>
      </section>
    </Prose>
  </InfoLayout>
);

export const ForgotPasswordPage = () => (
  <InfoLayout
    title="Forgot your password?"
    intro="Automatic reset emails aren't available yet. Send us a message from the email address on your account and we'll help you get back in."
  >
    <div className="flex flex-wrap gap-3">
      <Link to="/contact" className="btn-primary">
        Contact support
      </Link>
      <Link to="/login" className="btn-secondary">
        Back to sign in
      </Link>
    </div>
  </InfoLayout>
);
