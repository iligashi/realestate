import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { updateProfile } from '../../store/slices/authSlice';

const list = (v) => (Array.isArray(v) ? v.join(', ') : v || '');

// Account settings shared by the seller and agent dashboards:
// contact details, the agent's public profile, and password change.
const AccountSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAgent = user?.userType === 'agent';

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });
  const [agent, setAgent] = useState({
    agency: user?.agent?.agency || '',
    licenseNumber: user?.agent?.licenseNumber || '',
    experience: user?.agent?.experience ?? '',
    specializations: list(user?.agent?.specializations),
    languages: list(user?.agent?.languages)
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setSavingProfile(true);
    try {
      const payload = { ...profile };
      if (isAgent) payload.agent = { ...agent, experience: agent.experience === '' ? undefined : Number(agent.experience) };
      await dispatch(updateProfile(payload)).unwrap();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Could not save your profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pw.newPassword.length < 8) return setPwError('Use at least 8 characters');
    if (pw.newPassword !== pw.confirm) return setPwError('The new passwords do not match');
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      const data = err.response?.data;
      setPwError(data?.details?.map?.((d) => d.msg || d).join('. ') || data?.error || 'Could not change the password');
    } finally {
      setSavingPw(false);
    }
  };

  const input = (state, setState, key, label, props = {}) => (
    <div>
      <label htmlFor={`acc-${key}`} className="label">{label}</label>
      <input id={`acc-${key}`} className="input" value={state[key]} onChange={(e) => setState((s) => ({ ...s, [key]: e.target.value }))} {...props} />
    </div>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="card-plain p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
            <p className="text-sm text-gray-500">Signed in as {user?.email}</p>
          </div>
          <Link to="/profile" className="text-sm font-medium text-brand-700 hover:underline">Photo and preferences</Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {input(profile, setProfile, 'firstName', 'First name', { autoComplete: 'given-name' })}
          {input(profile, setProfile, 'lastName', 'Last name', { autoComplete: 'family-name' })}
          {input(profile, setProfile, 'phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
          <div className="sm:col-span-2">
            <label htmlFor="acc-bio" className="label">{isAgent ? 'About you (shown on your public profile)' : 'About'}</label>
            <textarea id="acc-bio" rows={3} maxLength={500} className="input" value={profile.bio} onChange={(e) => setProfile((s) => ({ ...s, bio: e.target.value }))} />
          </div>
        </div>

        {isAgent && (
          <>
            <h4 className="mt-6 text-sm font-semibold text-gray-900">Agent profile</h4>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {input(agent, setAgent, 'agency', 'Agency')}
              {input(agent, setAgent, 'licenseNumber', 'License number')}
              {input(agent, setAgent, 'experience', 'Years of experience', { type: 'number', min: 0, max: 80 })}
              {input(agent, setAgent, 'languages', 'Languages', { placeholder: 'English, Albanian' })}
              <div className="sm:col-span-2">
                {input(agent, setAgent, 'specializations', 'Specializations', { placeholder: 'Apartments, Luxury homes, Rentals' })}
                <p className="mt-1 text-xs text-gray-400">Separate with commas</p>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn-primary" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</button>
        </div>
      </form>

      <form onSubmit={savePassword} className="card-plain p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900">Password</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {input(pw, setPw, 'currentPassword', 'Current password', { type: 'password', autoComplete: 'current-password', required: true })}
          {input(pw, setPw, 'newPassword', 'New password', { type: 'password', autoComplete: 'new-password', required: true })}
          {input(pw, setPw, 'confirm', 'Confirm new password', { type: 'password', autoComplete: 'new-password', required: true })}
        </div>
        {pwError && <p className="mt-3 text-sm text-red-600" role="alert">{pwError}</p>}
        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn-primary" disabled={savingPw || !pw.currentPassword}>{savingPw ? 'Saving…' : 'Change password'}</button>
        </div>
      </form>
    </div>
  );
};

export default AccountSettings;
