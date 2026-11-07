const fs = require('fs');
const path = require('path');
const { app, request, connect, clear, disconnect, registerUser, authHeaders } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

// Smallest valid PNG (1x1 transparent pixel)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

const created = [];
afterAll(() => created.forEach((file) => fs.rmSync(file, { force: true })));

describe('profile picture upload', () => {
  it('stores a PNG and saves its URL on the profile', async () => {
    const session = await registerUser();
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeaders(session))
      .attach('profilePicture', PNG, { filename: 'me.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    const url = res.body.user.profilePicture;
    expect(url).toMatch(/^\/uploads\/profiles\/[\w-]+\.png$/);

    const file = path.join(__dirname, '..', url);
    created.push(file);
    expect(fs.existsSync(file)).toBe(true);
  });

  it('rejects SVG files', async () => {
    const session = await registerUser();
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeaders(session))
      .attach('profilePicture', SVG, { filename: 'x.svg', contentType: 'image/svg+xml' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG, PNG, WebP or GIF/);
  });

  it('rejects files over the size limit', async () => {
    const session = await registerUser();
    const big = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeaders(session))
      .attach('profilePicture', big, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/smaller than 5 MB/);
  });
});
