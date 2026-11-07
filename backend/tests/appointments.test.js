const Property = require('../models/Property');
const { app, request, connect, clear, disconnect, registerUser, sampleProperty, authHeaders } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

describe('viewing requests', () => {
  let buyer;
  let seller;
  let property;

  beforeEach(async () => {
    seller = await registerUser({ userType: 'seller' });
    buyer = await registerUser({ userType: 'buyer' });
    property = await Property.create(sampleProperty(seller.user._id));
  });

  const book = (body) =>
    request(app)
      .post('/api/appointments/viewing')
      .set(authHeaders(buyer))
      .send({ propertyId: property._id, ...body });

  it('books a viewing with a 24-hour time', async () => {
    const res = await book({ preferredDate: futureDate(), preferredTime: '14:00' });
    expect(res.status).toBe(201);

    const list = await request(app)
      .get('/api/appointments?type=viewing')
      .set(authHeaders(buyer));
    expect(list.status).toBe(200);
    expect(list.body.appointments).toHaveLength(1);
  });

  it('returns 400 (not 500) for a 12-hour time string', async () => {
    const res = await book({ preferredDate: futureDate(), preferredTime: '2:00 PM' });
    expect(res.status).toBe(400);
  });

  it('rejects a viewing in the past', async () => {
    const res = await book({ preferredDate: '2020-01-01', preferredTime: '10:00' });
    expect(res.status).toBe(400);
  });

  it('shows the viewing to the property owner too', async () => {
    await book({ preferredDate: futureDate(), preferredTime: '10:00' }).expect(201);

    const res = await request(app)
      .get('/api/appointments?type=viewing')
      .set(authHeaders(seller));
    expect(res.body.appointments).toHaveLength(1);
  });
});
