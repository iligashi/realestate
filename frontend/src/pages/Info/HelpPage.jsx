import { Link } from 'react-router-dom';
import InfoLayout from './InfoLayout';

const FAQ = [
  {
    section: 'Finding a property',
    items: [
      ['How do I search for properties?', 'Open All Properties and filter by type, price, city and bedrooms. Use the menu to jump straight to apartments, houses, offices or rentals.'],
      ['How do I book a viewing?', 'Open a property and choose Schedule Viewing. Pick a date and time; the owner confirms it and you can follow it under Viewings in your dashboard.'],
      ['Can I save properties for later?', 'Yes. Signed-in buyers can add listings to their wishlist and compare them side by side.']
    ]
  },
  {
    section: 'Listing a property',
    items: [
      ['How do I publish a listing?', 'Create a seller account, then use New Listing in your dashboard. Add photos, the address, price and details, then submit.'],
      ['Why is my listing not visible yet?', 'Listings with the status Pending are visible only to you and our moderators until they are reviewed.'],
      ['Where can I see how my listing performs?', 'The Analytics tab in the seller dashboard shows views, saves and inquiries for each listing.']
    ]
  },
  {
    section: 'Account and safety',
    items: [
      ['I forgot my password. What do I do?', 'Use the Forgot your password link on the sign-in page, which explains how to regain access.'],
      ['How do I report a listing or user?', 'Use Report Property on any listing, or the report option in a conversation. Our team reviews every report.'],
      ['Is my contact information public?', 'Only the details you choose to show on a listing are visible to other users. See our Privacy Policy for more.']
    ]
  }
];

const HelpPage = () => (
  <InfoLayout
    eyebrow="Help Center"
    title="Frequently asked questions"
    intro="Quick answers about searching, listing and managing your account."
  >
    <div className="space-y-10">
      {FAQ.map(({ section, items }) => (
        <section key={section}>
          <h2 className="text-lg font-semibold text-gray-900">{section}</h2>
          <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200">
            {items.map(([q, a]) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-900">
                  {q}
                  <span className="text-xl leading-none text-gray-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>

    <p className="mt-12 text-sm text-gray-600">
      Still need help? <Link to="/contact" className="font-medium text-brand-600 hover:underline">Contact our team</Link>.
    </p>
  </InfoLayout>
);

export default HelpPage;
