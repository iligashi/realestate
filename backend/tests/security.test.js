const Property = require('../models/Property');
const { stripOperators } = require('../middleware/sanitize');
const { escapeRegex, searchRegex } = require('../utils/searchRegex');
const { app, request, connect, clear, disconnect, newUser, registerUser, sampleProperty, authHeaders } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('sanitize middleware', () => {
  it('removes $-operators and dotted keys at any depth', () => {
    const input = {
      email: { $ne: null },
      'owner.role': 'admin',
      nested: { ok: 1, $where: 'sleep(1000)' },
      list: [{ $gt: 1, keep: true }]
    };
    expect(stripOperators(input)).toEqual({ email: {}, nested: { ok: 1 }, list: [{ keep: true }] });
  });

  it('blocks login with a NoSQL operator instead of a password', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: { $ne: 'x' } });

    expect(res.status).not.toBe(200);
    expect(res.body.token).toBeUndefined();
  });

  it('ignores operator injection in property search filters', async () => {
    const { user } = await registerUser({ userType: 'seller' });
    await Property.create(sampleProperty(user._id, { propertyType: 'house' }));
    await Property.create(sampleProperty(user._id, { propertyType: 'apartment', title: 'City Flat' }));

    // Unsanitized, propertyType[$ne]=house becomes { $ne: 'house' } and the
    // client controls the query. Sanitized, the operator is dropped entirely.
    const res = await request(app).get('/api/properties?propertyType[$ne]=house');

    expect(res.status).toBe(200);
    expect(res.body.properties).toHaveLength(2);
  });

  it('caps the page size at 100', async () => {
    const res = await request(app).get('/api/properties?limit=1000000');
    expect(res.status).toBe(200);
    expect(res.body.pagination.itemsPerPage).toBe(100);
  });
});

describe('search regex escaping', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b*(c)+')).toBe('a\\.b\\*\\(c\\)\\+');
  });

  it('treats user input as plain text', async () => {
    const { user } = await registerUser({ userType: 'seller' });
    await Property.create(sampleProperty(user._id));

    // '.*' would match every city if it were used as a raw pattern
    const res = await request(app).get('/api/properties?city=.*');
    expect(res.status).toBe(200);
    expect(res.body.properties).toHaveLength(0);

    const match = await request(app).get('/api/properties?city=prisht');
    expect(match.body.properties).toHaveLength(1);
  });

  it('limits search length', () => {
    expect(searchRegex('x'.repeat(500)).$regex).toHaveLength(100);
  });
});

describe('removed endpoints', () => {
  it('no longer exposes the unimplemented payments API', async () => {
    const session = await registerUser();
    const res = await request(app).get('/api/payments').set(authHeaders(session));
    expect(res.status).toBe(404);
  });
});
