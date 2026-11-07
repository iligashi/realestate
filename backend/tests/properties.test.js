const Property = require('../models/Property');
const { app, request, connect, clear, disconnect, registerUser, sampleProperty, authHeaders } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

describe('properties API', () => {
  it('lists properties publicly', async () => {
    const { user } = await registerUser({ userType: 'seller' });
    await Property.create(sampleProperty(user._id));

    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain('Sunny Family Home');
  });

  it('returns a single property by id', async () => {
    const { user } = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(user._id));

    const res = await request(app).get(`/api/properties/${property._id}`);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain('Sunny Family Home');
  });

  it('returns 404 for a property that does not exist', async () => {
    const res = await request(app).get('/api/properties/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('requires authentication to delete', async () => {
    const { user } = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(user._id));

    const res = await request(app).delete(`/api/properties/${property._id}`);
    expect(res.status).toBe(401);
  });

  it("does not let a user delete someone else's property", async () => {
    const owner = await registerUser({ userType: 'seller' });
    const other = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(owner.user._id));

    const res = await request(app)
      .delete(`/api/properties/${property._id}`)
      .set(authHeaders(other));

    expect(res.status).toBe(403);
    expect(await Property.exists({ _id: property._id })).toBeTruthy();
  });

  it('lets the owner delete their property', async () => {
    const owner = await registerUser({ userType: 'seller' });
    const property = await Property.create(sampleProperty(owner.user._id));

    const res = await request(app)
      .delete(`/api/properties/${property._id}`)
      .set(authHeaders(owner));

    expect(res.status).toBe(200);
    expect(await Property.exists({ _id: property._id })).toBeFalsy();
  });
});
