const Property = require('../models/Property');
const User = require('../models/User');
const Message = require('../models/Message');
const PlatformSettings = require('../models/PlatformSettings');
const { clearSettingsCache } = require('../utils/settings');
const { app, request, connect, clear, disconnect, registerUser, authHeaders, sampleProperty } = require('./helpers');

beforeAll(connect);
afterEach(async () => {
  await clear();
  clearSettingsCache();
});
afterAll(disconnect);

const makeAdmin = async () => {
  const admin = await registerUser({ userType: 'buyer' });
  await User.updateOne({ _id: admin.user._id }, { userType: 'admin' });
  return admin;
};

const listing = (overrides = {}) => ({
  title: 'Bright two-bedroom flat',
  description: 'A bright two-bedroom flat close to the city centre, with a balcony and parking space.',
  propertyType: 'apartment',
  listingType: 'sale',
  price: 120000,
  currency: 'EUR',
  location: { type: 'Point', coordinates: [0, 0] },
  address: { city: 'Prishtina', country: 'Kosovo' },
  details: { bedrooms: 2, bathrooms: 1, squareMeters: 80 },
  ...overrides,
});

const setSettings = async (patch) => {
  const s = await PlatformSettings.getSettings();
  for (const [k, v] of Object.entries(patch)) s.set(k, v);
  await s.save();
  clearSettingsCache();
};

describe('who can create listings', () => {
  it('blocks buyers from listing a property', async () => {
    const buyer = await registerUser({ userType: 'buyer' });
    const res = await request(app).post('/api/properties').set(authHeaders(buyer)).send(listing());
    expect(res.status).toBe(403);
  });

  it('lets renters post rentals but not sales', async () => {
    const renter = await registerUser({ userType: 'renter' });
    const sale = await request(app).post('/api/properties').set(authHeaders(renter)).send(listing());
    expect(sale.status).toBe(403);
    const rental = await request(app)
      .post('/api/properties')
      .set(authHeaders(renter))
      .send(listing({ listingType: 'rental', rentalDetails: { monthlyRent: 650, availableFrom: '2030-01-01', availableUntil: '2031-01-01', minimumLeaseMonths: 6 } }));
    expect(rental.status).toBe(201);
  });

  it('makes an agent the representative of a listing they create', async () => {
    const agent = await registerUser({ userType: 'agent' });
    await request(app).post('/api/properties').set(authHeaders(agent)).send(listing()).expect(201);
    const saved = await Property.findOne({});
    expect(String(saved.agent)).toBe(agent.user._id);
    expect(saved.status).toBe('pending');
  });

  it('enforces the per-user listing limit from settings', async () => {
    await setSettings({ 'features.maxListingsPerUser': 1 });
    const seller = await registerUser({ userType: 'seller' });
    await request(app).post('/api/properties').set(authHeaders(seller)).send(listing()).expect(201);
    const res = await request(app).post('/api/properties').set(authHeaders(seller)).send(listing());
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/limit/);
  });

  it('publishes straight away when approval is switched off', async () => {
    await setSettings({ 'features.requireListingApproval': false });
    const seller = await registerUser({ userType: 'seller' });
    await request(app).post('/api/properties').set(authHeaders(seller)).send(listing()).expect(201);
    expect((await Property.findOne({})).status).toBe('active');
  });
});

describe('assigning agents', () => {
  const setup = async () => {
    const admin = await makeAdmin();
    const seller = await registerUser({ userType: 'seller' });
    const agent = await registerUser({ userType: 'agent' });
    const property = await Property.create(sampleProperty(seller.user._id));
    return { admin, seller, agent, property };
  };

  it('lets an admin assign and remove an agent', async () => {
    const { admin, agent, property } = await setup();
    const res = await request(app)
      .patch(`/api/admin/listings/${property._id}/agent`)
      .set(authHeaders(admin))
      .send({ agentId: agent.user._id });
    expect(res.status).toBe(200);
    expect(res.body.listing.agent._id).toBe(agent.user._id);

    const removed = await request(app)
      .patch(`/api/admin/listings/${property._id}/agent`)
      .set(authHeaders(admin))
      .send({ agentId: null });
    expect(removed.status).toBe(200);
    expect((await Property.findById(property._id)).agent).toBeUndefined();
  });

  it('refuses to assign a user who is not an agent', async () => {
    const { admin, seller, property } = await setup();
    const res = await request(app)
      .patch(`/api/admin/listings/${property._id}/agent`)
      .set(authHeaders(admin))
      .send({ agentId: seller.user._id });
    expect(res.status).toBe(400);
  });

  it('does not let a seller assign agents', async () => {
    const { seller, agent, property } = await setup();
    const res = await request(app)
      .patch(`/api/admin/listings/${property._id}/agent`)
      .set(authHeaders(seller))
      .send({ agentId: agent.user._id });
    expect(res.status).toBe(403);
  });

  it('lets the assigned agent edit and change status, but not another agent', async () => {
    const { agent, property } = await setup();
    const other = await registerUser({ userType: 'agent' });
    await Property.updateOne({ _id: property._id }, { agent: agent.user._id });

    await request(app)
      .put(`/api/properties/${property._id}`)
      .set(authHeaders(agent))
      .send({ title: 'Renovated family home' })
      .expect(200);
    await request(app)
      .patch(`/api/agent/listings/${property._id}/status`)
      .set(authHeaders(agent))
      .send({ status: 'under-contract' })
      .expect(200);
    expect((await Property.findById(property._id)).status).toBe('under-contract');

    await request(app).put(`/api/properties/${property._id}`).set(authHeaders(other)).send({ title: 'Someone else edits this' }).expect(403);
    await request(app)
      .patch(`/api/agent/listings/${property._id}/status`)
      .set(authHeaders(other))
      .send({ status: 'sold' })
      .expect(403);
    // Assigned agents cannot delete the owner's listing
    await request(app).delete(`/api/properties/${property._id}`).set(authHeaders(agent)).expect(403);
  });

  it('shows assigned listings on the agent dashboard', async () => {
    const { agent, property } = await setup();
    await Property.updateOne({ _id: property._id }, { agent: agent.user._id });
    const res = await request(app).get('/api/agent/dashboard').set(authHeaders(agent));
    expect(res.status).toBe(200);
    expect(res.body.stats.totalListings).toBe(1);
    expect(res.body.stats.assigned).toBe(1);
  });

  it('keeps sellers out of the agent API', async () => {
    const seller = await registerUser({ userType: 'seller' });
    await request(app).get('/api/agent/dashboard').set(authHeaders(seller)).expect(403);
  });

  it('sends buyer inquiries to the assigned agent', async () => {
    const { agent, property } = await setup();
    await Property.updateOne({ _id: property._id }, { agent: agent.user._id });
    const buyer = await registerUser({ userType: 'buyer' });
    await request(app)
      .post('/api/messages')
      .set(authHeaders(buyer))
      .send({ propertyId: property._id, subject: 'Viewing', message: 'Can I visit on Friday?' })
      .expect(201);
    const msg = await Message.findOne({});
    expect(String(msg.seller)).toBe(agent.user._id);
  });

  it('lists agents publicly with their listing counts', async () => {
    const { agent, property } = await setup();
    await Property.updateOne({ _id: property._id }, { agent: agent.user._id });
    const res = await request(app).get('/api/agents');
    expect(res.status).toBe(200);
    expect(res.body.agents).toHaveLength(1);
    expect(res.body.agents[0].activeListings).toBe(1);
    expect(res.body.agents[0].email).toBeDefined();
    expect(res.body.agents[0].password).toBeUndefined();

    const profile = await request(app).get(`/api/agents/${agent.user._id}`);
    expect(profile.status).toBe(200);
    expect(profile.body.listings).toHaveLength(1);
  });

  it('lets agents update their professional profile', async () => {
    const agent = await registerUser({ userType: 'agent' });
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeaders(agent))
      .send({ agent: { agency: 'Nexora Realty', experience: 6, languages: 'English, Albanian', rating: { average: 5 } } });
    expect(res.status).toBe(200);
    const saved = await User.findById(agent.user._id);
    expect(saved.agent.agency).toBe('Nexora Realty');
    expect(saved.agent.languages).toEqual(['English', 'Albanian']);
    expect(saved.agent.rating.average).toBe(0);
  });
});

describe('announcements', () => {
  const create = (admin, body) => request(app).post('/api/admin/announcements').set(authHeaders(admin)).send(body);
  const base = { title: 'New feature', content: 'Saved searches are here.', type: 'update', priority: 'medium' };

  it('creates, edits and deletes an announcement', async () => {
    const admin = await makeAdmin();
    const created = await create(admin, { ...base, createdBy: 'ignored', metadata: { views: 999 } });
    expect(created.status).toBe(201);
    expect(created.body.announcement.state).toBe('live');
    expect(created.body.announcement.metadata.views).toBe(0);
    const id = created.body.announcement._id;

    const edited = await request(app)
      .put(`/api/admin/announcements/${id}`)
      .set(authHeaders(admin))
      .send({ title: 'Updated', isActive: false });
    expect(edited.status).toBe(200);
    expect(edited.body.announcement.title).toBe('Updated');
    expect(edited.body.announcement.state).toBe('draft');

    await request(app).delete(`/api/admin/announcements/${id}`).set(authHeaders(admin)).expect(200);
  });

  it('rejects an end date before the start date', async () => {
    const admin = await makeAdmin();
    const res = await create(admin, { ...base, startDate: '2030-02-01', endDate: '2030-01-01' });
    expect(res.status).toBe(400);
  });

  it('only shows scheduled announcements once they start, and hides expired ones', async () => {
    const admin = await makeAdmin();
    const day = 24 * 3600 * 1000;
    await create(admin, { ...base, title: 'Later', startDate: new Date(Date.now() + day).toISOString() }).expect(201);
    await create(admin, {
      ...base,
      title: 'Old',
      startDate: new Date(Date.now() - 3 * day).toISOString(),
      endDate: new Date(Date.now() - day).toISOString(),
    }).expect(201);
    await create(admin, { ...base, title: 'Now' }).expect(201);

    const res = await request(app).get('/api/announcements');
    expect(res.body.announcements.map((a) => a.title)).toEqual(['Now']);

    const list = await request(app).get('/api/admin/announcements').set(authHeaders(admin));
    const states = Object.fromEntries(list.body.announcements.map((a) => [a.title, a.state]));
    expect(states).toEqual({ Later: 'scheduled', Old: 'expired', Now: 'live' });
  });

  it('targets announcements by role and sorts pinned and urgent first', async () => {
    const admin = await makeAdmin();
    await create(admin, { ...base, title: 'For sellers', targetAudience: ['sellers'] }).expect(201);
    await create(admin, { ...base, title: 'Low', priority: 'low' }).expect(201);
    await create(admin, { ...base, title: 'Urgent', priority: 'urgent' }).expect(201);
    await create(admin, { ...base, title: 'Pinned', priority: 'low', isPinned: true }).expect(201);

    const anon = await request(app).get('/api/announcements');
    expect(anon.body.announcements.map((a) => a.title)).toEqual(['Pinned', 'Urgent', 'Low']);

    const seller = await registerUser({ userType: 'seller' });
    const mine = await request(app).get('/api/announcements').set(authHeaders(seller));
    expect(mine.body.announcements.map((a) => a.title)).toContain('For sellers');
  });
});

describe('platform settings', () => {
  it('only updates whitelisted fields and exposes a safe public view', async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .put('/api/admin/settings')
      .set(authHeaders(admin))
      .send({
        general: { siteName: 'Nexora Homes', address: { city: 'Prishtina' } },
        features: { maxListingsPerUser: 25, enableMessaging: false },
        appearance: { customCSS: 'body{display:none}' },
      });
    expect(res.status).toBe(200);
    expect(res.body.settings.general.siteName).toBe('Nexora Homes');
    expect(res.body.settings.general.address.city).toBe('Prishtina');
    expect(res.body.settings.features.maxListingsPerUser).toBe(25);
    expect(res.body.settings.appearance.customCSS).toBeUndefined();

    const pub = await request(app).get('/api/settings');
    expect(pub.body.settings.general.siteName).toBe('Nexora Homes');
    expect(pub.body.settings.features.enableMessaging).toBe(false);
    expect(pub.body.settings.business).toBeUndefined();
  });

  it('rejects invalid values', async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .put('/api/admin/settings')
      .set(authHeaders(admin))
      .send({ features: { maxListingsPerUser: 5000 } });
    expect(res.status).toBe(400);
  });

  it('blocks new conversations when messaging is off', async () => {
    await setSettings({ 'features.enableMessaging': false });
    const seller = await registerUser({ userType: 'seller' });
    const buyer = await registerUser({ userType: 'buyer' });
    const property = await Property.create(sampleProperty(seller.user._id));
    const res = await request(app)
      .post('/api/messages')
      .set(authHeaders(buyer))
      .send({ propertyId: property._id, subject: 'Hi', message: 'Is it available?' });
    expect(res.status).toBe(403);
  });

  it('makes the API read-only for non-admins during maintenance', async () => {
    await setSettings({ 'maintenance.isMaintenanceMode': true, 'maintenance.maintenanceMessage': 'Back at noon' });
    const seller = await registerUser({ userType: 'seller' });
    const res = await request(app).post('/api/properties').set(authHeaders(seller)).send(listing());
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Back at noon');

    await request(app).get('/api/properties').expect(200);
    const pub = await request(app).get('/api/settings');
    expect(pub.body.settings.maintenance.active).toBe(true);

    const admin = await makeAdmin();
    await request(app).post('/api/properties').set(authHeaders(admin)).send(listing()).expect(201);
  });
});
