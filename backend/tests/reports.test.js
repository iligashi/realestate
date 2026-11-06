const Property = require('../models/Property');
const { app, request, connect, clear, disconnect, registerUser, sampleProperty } = require('./helpers');

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const reportBody = (propertyId) => ({
  reportedItemId: propertyId,
  reportedItemModel: 'property',
  type: 'fraud',
  reason: 'The listing photos are copied from another website.'
});

describe('reports API', () => {
  let reporter;
  let property;

  beforeEach(async () => {
    const seller = await registerUser({ userType: 'seller' });
    reporter = await registerUser({ userType: 'buyer' });
    property = await Property.create(sampleProperty(seller.user._id));
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/reports').send(reportBody(property._id));
    expect(res.status).toBe(401);
  });

  it('creates a report for a property', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.token}`)
      .send(reportBody(property._id));

    expect(res.status).toBe(201);
    expect(res.body.report.reportedItemModel).toBe('Property');
    expect(res.body.report.status).toBe('pending');
  });

  it('rejects reporting the same item twice', async () => {
    const send = () =>
      request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${reporter.token}`)
        .send(reportBody(property._id));

    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(400);
  });

  it('returns 404 when the reported item does not exist', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.token}`)
      .send(reportBody('507f1f77bcf86cd799439011'));
    expect(res.status).toBe(404);
  });

  it("lists the user's own reports", async () => {
    await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${reporter.token}`)
      .send(reportBody(property._id))
      .expect(201);

    const res = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${reporter.token}`);

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });
});
