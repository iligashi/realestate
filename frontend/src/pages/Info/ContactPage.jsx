import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { CheckCircleIcon, ClockIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import InfoLayout from './InfoLayout';

const SUBJECTS = [
  ['general', 'General question'],
  ['listing', 'A listing'],
  ['account', 'My account'],
  ['report', 'Report a problem'],
  ['partnership', 'Partnerships']
];

const ContactPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    subject: 'general',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const validateForm = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Please enter a valid email';
    if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSending(true);
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <InfoLayout
      eyebrow="Contact"
      title="How can we help?"
      intro="Send us a message and our team will reply by email, usually within one business day."
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_16rem]">
        {sent ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <CheckCircleIcon className="h-12 w-12 text-brand-600" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Message sent</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-600">
              Thanks, {form.name.split(' ')[0]}. We&apos;ll reply to {form.email} soon.
            </p>
            <Link to="/properties" className="btn-secondary mt-6">
              Back to browsing
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="card space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="label">Name</label>
                <input id="contact-name" className="input" value={form.name} onChange={update('name')} autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="contact-email" className="label">Email</label>
                <input id="contact-email" type="email" className="input" value={form.email} onChange={update('email')} autoComplete="email" aria-invalid={!!errors.email} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="contact-subject" className="label">Topic</label>
              <select id="contact-subject" className="input" value={form.subject} onChange={update('subject')}>
                {SUBJECTS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className="label">Message</label>
              <textarea id="contact-message" rows={6} className="input resize-y" value={form.message} onChange={update('message')} maxLength={2000} aria-invalid={!!errors.message} />
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-red-600">{errors.message}</span>
                <span className="text-gray-400">{form.message.length}/2000</span>
              </div>
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto">
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}

        <aside className="space-y-6 text-sm">
          <div className="flex gap-3">
            <ClockIcon className="h-5 w-5 flex-shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <p className="font-medium text-gray-900">Response time</p>
              <p className="text-gray-600">Usually within one business day.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <QuestionMarkCircleIcon className="h-5 w-5 flex-shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <p className="font-medium text-gray-900">Quick answers</p>
              <p className="text-gray-600">
                Many questions are answered in the <Link to="/help" className="font-medium text-brand-600 hover:underline">Help Center</Link>.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </InfoLayout>
  );
};

export default ContactPage;
