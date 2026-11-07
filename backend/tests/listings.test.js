const Property = require('../models/Property');
const User = require('../models/User');
const { app, request, connect, clear, disconnect, registerUser, authHeaders, sampleProperty } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const listing = (overrides = {}) => ({
  title: 'Bright two-bedroom flat',
  description: 'A bright two-bedroom flat close to the city centre, with a balcony and parking space.',
  propertyType: 'apartment',
  listingType: 'sale',
  price: 120000,
  currency: 'EUR',
  address: { city: 'Prishtina', country: 'Kosovo' },
  location: { type: 'Point', coordinates: [0, 0] },
  details: { bedrooms: 2, bathrooms: 1.5, squareMeters: 80 },
  ...overrides
});

const makeAdmin = async () => {
  const admin = await registerUser({ userType: 'buyer' });
  await User.updateOne({ _id: admin.user._id }, { userType: 'admin' });
  return admin;
};

describe('creating listings', () => {
  it('puts a seller listing in pending review, whatever status is sent', async () => {
    const seller = await registerUser({ userType: 'seller' });
    const res = await request(app)
      .post('/api/properties')
      .set(authHeaders(seller))
      .send(listing({ status: 'active', features: { featured: 'true' } }));

    expect(res.status).toBe(201);
    const saved = await Property.findOne({ title: 'Bright two-bedroom flat' });
    expect(saved.status).toBe('pending');
    expect(saved.features.featured).toBe(false);
    expect(saved.details.bathrooms).toBe(1.5);
    expect(saved.address.country).toBe('Kosovo');
  });

  it('keeps pending listings out of the public list', async () => {
    const seller = await registerUser({ userType: 'seller' });
    await request(app).post('/api/properties').set(authHeaders(seller)).send(listing()).expect(201);

    const res = await request(app).get('/api/properties');
    expect(res.body.properties).toHaveLength(0);
  });

  it('rejects a description shorter than 50 characters', async () => {
    const seller = await registerUser({ userType: 'seller' });
    const res = await request(app)
      .post('/api/properties')
      .set(authHeaders(seller))
      .send(listing({ description: 'Too short' }));
    expect(res.status).toBe(400);
  });

  it('accepts a rental with lease terms', async () => {
    const renter = await registerUser({ userType: 'renter' });
    const from = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const until = new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10);
    const res = await request(app)
      .post('/api/properties')
      .set(authHeaders(renter))
      .send(listing({
        listingType: 'rental',
        price: 650,
        rentalDetails: { monthlyRent: 650, availableFrom: from, availableUntil: until, minimumLeaseMonths: 6 }
      }));
    expect(res.status).toBe(201);
    const saved = await Property.findOne({ title: 'Bright two-bedroom flat' });
    expect(saved.rentalDetails.monthlyRent).toBe(650);
    expect(saved.status).toBe('pending');
  });
});

describe('updating listings', () => {
  it('only lets the owner edit allowed fields', async () => {
    const owner = await registerUser({ userType: 'seller' });
    const other = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(owner.user._id));

    const res = await request(app)
      .put(`/api/properties/${property._id}`)
      .set(authHeaders(owner))
      .send({ title: 'Renamed family home', owner: other.user._id, isFeatured: true, analytics: { views: 9999 } });

    expect(res.status).toBe(200);
    const saved = await Property.findById(property._id);
    expect(saved.title).toBe('Renamed family home');
    expect(String(saved.owner)).toBe(String(owner.user._id));
    expect(saved.isFeatured).toBeFalsy();
    expect(saved.analytics.views).toBe(0);
  });

  it('does not let an owner approve their own pending listing', async () => {
    const owner = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(owner.user._id, { status: 'pending' }));

    const res = await request(app).put(`/api/properties/${property._id}`).set(authHeaders(owner)).send({ status: 'active' });
    expect(res.status).toBe(403);
    expect((await Property.findById(property._id)).status).toBe('pending');
  });

  it('lets an owner mark an approved listing as sold', async () => {
    const owner = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(owner.user._id));

    const res = await request(app).put(`/api/properties/${property._id}`).set(authHeaders(owner)).send({ status: 'sold' });
    expect(res.status).toBe(200);
    expect((await Property.findById(property._id)).status).toBe('sold');
  });

  it('lets an admin approve a pending listing', async () => {
    const owner = await registerUser({ userType: 'seller' });
    const admin = await makeAdmin();
    const property = await Property.create(sampleProperty(owner.user._id, { status: 'pending' }));

    const res = await request(app).put(`/api/properties/${property._id}`).set(authHeaders(admin)).send({ status: 'active' });
    expect(res.status).toBe(200);
    expect((await Property.findById(property._id)).status).toBe('active');
  });
});
