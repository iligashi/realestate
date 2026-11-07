import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import InfoLayout from './InfoLayout';

const VALUES = [
  {
    icon: HomeModernIcon,
    title: 'Every kind of property',
    text: 'Houses, apartments and offices, for sale or for rent, in one place with clear filters.'
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Talk directly',
    text: 'Message owners in real time, book viewings and apply for rentals without leaving the platform.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Moderated listings',
    text: 'New listings are reviewed, and anyone can report a listing or user that looks wrong.'
  },
  {
    icon: UserGroupIcon,
    title: 'Built for every role',
    text: 'Buyers, sellers, renters and agents each get a dashboard designed for what they need to do.'
  }
];

const AboutPage = () => (
  <InfoLayout
    eyebrow="About us"
    title="A simpler way to find, list and rent property"
    intro="RealEstate connects people looking for a home or workspace with the owners and agents who have one. Fewer middle steps, clearer listings and conversations that happen in one place."
  >
    <div className="grid gap-6 sm:grid-cols-2">
      {VALUES.map(({ icon: Icon, title, text }) => (
        <div key={title} className="card">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>
        </div>
      ))}
    </div>

    <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-gray-900 px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Ready to get started?</h2>
        <p className="mt-1 text-sm text-gray-300">Browse listings or publish your own in a few minutes.</p>
      </div>
      <div className="flex gap-3">
        <Link to="/properties" className="btn bg-white text-gray-900 hover:bg-gray-100">
          Browse properties
        </Link>
        <Link to="/contact" className="btn border border-white/30 text-white hover:bg-white/10">
          Contact us
        </Link>
      </div>
    </div>
  </InfoLayout>
);

export default AboutPage;
