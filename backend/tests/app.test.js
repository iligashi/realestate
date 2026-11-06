const { app, request } = require('./helpers');

describe('app', () => {
  it('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('does not expose debug endpoints', async () => {
    expect((await request(app).post('/test-property')).status).toBe(404);
    expect((await request(app).post('/test-upload')).status).toBe(404);
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
