const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bootstrapAdmin = require('../utils/bootstrapAdmin');
const { app, request, connect, clear, disconnect, registerUser, authHeaders } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('GET /api/auth/socket-token', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/auth/socket-token')).status).toBe(401);
  });

  it('returns a short-lived token for the real-time connection', async () => {
    const session = await registerUser();
    const res = await request(app).get('/api/auth/socket-token').set(authHeaders(session));

    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.purpose).toBe('socket');
    expect(decoded.exp - decoded.iat).toBeLessThanOrEqual(300);
  });

  it('cannot be used as an API session token', async () => {
    const session = await registerUser();
    const { body } = await request(app).get('/api/auth/socket-token').set(authHeaders(session));

    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(401);
  });
});

describe('bootstrapAdmin', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('does nothing without ADMIN_EMAIL / ADMIN_PASSWORD', async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    expect(await bootstrapAdmin()).toBeNull();
    expect(await User.countDocuments({ userType: 'admin' })).toBe(0);
  });

  it('refuses a short password', async () => {
    process.env.ADMIN_EMAIL = 'owner@example.com';
    process.env.ADMIN_PASSWORD = 'short';
    expect(await bootstrapAdmin()).toBeNull();
    expect(await User.countDocuments({ userType: 'admin' })).toBe(0);
  });

  it('creates the admin once and can log in', async () => {
    process.env.ADMIN_EMAIL = 'Owner@Example.com';
    process.env.ADMIN_PASSWORD = 'a-long-secure-password';

    expect(await bootstrapAdmin()).not.toBeNull();
    expect(await bootstrapAdmin()).toBeNull(); // second start: already exists

    const admins = await User.find({ userType: 'admin' });
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe('owner@example.com');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'a-long-secure-password' });
    expect(res.status).toBe(200);
    expect(res.body.user.userType).toBe('admin');
  });
});
