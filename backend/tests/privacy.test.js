const Property = require('../models/Property');
const User = require('../models/User');
const {
  app,
  request,
  connect,
  clear,
  disconnect,
  newUser,
  registerUser,
  sampleProperty,
  authHeaders
} = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('owner contact details', () => {
  const ownerWithPhone = () => registerUser({ userType: 'seller', phone: '+38344111222' });

  it('are not exposed in the public property list', async () => {
    const owner = await ownerWithPhone();
    await Property.create(sampleProperty(owner.user._id));

    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    const listed = res.body.properties[0].owner;
    expect(listed.firstName).toBe('Test');
    expect(listed.email).toBeUndefined();
    expect(listed.phone).toBeUndefined();
  });

  it('are not exposed on the property page to other users', async () => {
    const owner = await ownerWithPhone();
    const visitor = await registerUser({ userType: 'buyer' });
    const property = await Property.create(sampleProperty(owner.user._id));

    const anonymous = await request(app).get(`/api/properties/${property._id}`);
    const loggedIn = await request(app).get(`/api/properties/${property._id}`).set(authHeaders(visitor));

    for (const res of [anonymous, loggedIn]) {
      expect(res.status).toBe(200);
      expect(res.body.property.owner.firstName).toBe('Test');
      expect(res.body.property.owner.email).toBeUndefined();
      expect(res.body.property.owner.phone).toBeUndefined();
    }
  });

  it('are shown to the owner of the listing', async () => {
    const owner = await ownerWithPhone();
    const property = await Property.create(sampleProperty(owner.user._id));

    const res = await request(app).get(`/api/properties/${property._id}`).set(authHeaders(owner));

    expect(res.status).toBe(200);
    expect(res.body.property.owner.email).toBe(owner.user.email);
  });
});

describe('blocked accounts', () => {
  it('cannot log in', async () => {
    const creds = newUser();
    await request(app).post('/api/auth/register').send(creds);
    await User.updateOne({ email: creds.email }, { isBlocked: true });

    const res = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });

    expect(res.status).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('lose access with an existing session', async () => {
    const session = await registerUser();
    await User.updateOne({ _id: session.user._id }, { isBlocked: true });

    const res = await request(app).get('/api/auth/profile').set(authHeaders(session));

    expect(res.status).toBe(403);
  });

  it('receive a single session cookie on login', async () => {
    const creds = newUser();
    await request(app).post('/api/auth/register').send(creds);

    const res = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].filter((c) => c.startsWith('token='))).toHaveLength(1);
  });
});

describe('property coordinates', () => {
  const create = (session, body) => request(app).post('/api/properties').set(authHeaders(session)).send(body);

  // A create payload as the form sends it (no owner/status: the server sets those)
  const listing = (overrides = {}) => {
    // eslint-disable-next-line no-unused-vars
    const { owner, status, ...body } = sampleProperty(undefined, overrides);
    return body;
  };

  it('stores the submitted coordinates', async () => {
    const seller = await registerUser({ userType: 'seller' });

    const res = await create(seller, listing({ location: { type: 'Point', coordinates: ['21.1655', '42.6629'] } }));

    expect(res.status).toBe(201);
    const saved = await Property.findOne({ owner: seller.user._id });
    expect(saved.location.coordinates).toEqual([21.1655, 42.6629]);
  });

  it('leaves location unset instead of defaulting to [0, 0]', async () => {
    const seller = await registerUser({ userType: 'seller' });

    const res = await create(seller, listing({ location: undefined }));

    expect(res.status).toBe(201);
    const saved = await Property.findOne({ owner: seller.user._id });
    expect(saved.location).toBeUndefined();
  });

  it('rejects out-of-range coordinates', async () => {
    const seller = await registerUser({ userType: 'seller' });

    const res = await create(seller, listing({ location: { type: 'Point', coordinates: [200, 95] } }));

    expect(res.status).toBe(400);
    expect(await Property.countDocuments({ owner: seller.user._id })).toBe(0);
  });
});
