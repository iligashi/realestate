const {
  app,
  request,
  connect,
  clear,
  disconnect,
  newUser,
  registerUser,
  authCookie,
  authHeaders
} = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const sessionCookie = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('token='));

describe('POST /api/auth/register', () => {
  it('creates a user and signs them in with an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser({ userType: 'seller' }));

    expect(res.status).toBe(201);
    expect(res.body.user.userType).toBe('seller');
    expect(res.body.user.password).toBeUndefined();

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    // The token must never be readable by page JavaScript
    expect(res.body.token).toBeUndefined();
  });

  it('rejects self-registration as admin', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser({ userType: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(400);
  });

  it('rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser({ email: 'not-an-email', password: '123' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the correct password and sets the session cookie', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(authCookie(res)).toMatch(/^token=.+/);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects a wrong password without setting a cookie', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(sessionCookie(res)).toBeUndefined();
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('session', () => {
  it('requires a session for the profile', async () => {
    expect((await request(app).get('/api/auth/profile')).status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/auth/profile').set('Cookie', 'token=not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the current user from the cookie', async () => {
    const session = await registerUser();
    const res = await request(app).get('/api/auth/profile').set(authHeaders(session));

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain(session.user.email);
    expect(JSON.stringify(res.body)).not.toContain('Password123!');
  });

  it('logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout').set('X-Requested-With', 'XMLHttpRequest');
    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toMatch(/token=;/);
  });
});

describe('CSRF protection', () => {
  it('blocks cookie-authenticated writes without the X-Requested-With header', async () => {
    const session = await registerUser();
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Cookie', session.cookie)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(403);
  });

  it('allows reads with just the cookie', async () => {
    const session = await registerUser();
    const res = await request(app).get('/api/auth/profile').set('Cookie', session.cookie);
    expect(res.status).toBe(200);
  });
});
