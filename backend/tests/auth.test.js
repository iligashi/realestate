const { app, request, connect, clear, disconnect, newUser, registerUser } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without the password', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser({ userType: 'seller' }));

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.userType).toBe('seller');
    expect(res.body.user.password).toBeUndefined();
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
  it('logs in with the correct password', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password', async () => {
    const user = newUser();
    await request(app).post('/api/auth/register').send(user).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/profile', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/auth/profile').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the current user', async () => {
    const { token, user } = await registerUser();
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain(user.email);
    expect(JSON.stringify(res.body)).not.toContain('Password123!');
  });
});
