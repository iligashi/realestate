const http = require('http');
const jwt = require('jsonwebtoken');
const { io: ioClient } = require('socket.io-client');
const SocketServer = require('../websocket/socketServer');
const Message = require('../models/Message');
const Property = require('../models/Property');
const User = require('../models/User');
const { connect, clear, disconnect, registerUser, sampleProperty } = require('./helpers');

let httpServer;
let socketServer;
let port;
const clients = [];

beforeAll(async () => {
  await connect();
  httpServer = http.createServer();
  socketServer = new SocketServer(httpServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  port = httpServer.address().port;
});

afterEach(async () => {
  clients.splice(0).forEach((c) => c.close());
  await clear();
});

afterAll(async () => {
  socketServer.io.close();
  await disconnect();
});

const socketToken = (userId) =>
  jwt.sign({ userId, purpose: 'socket' }, process.env.JWT_SECRET, { expiresIn: '5m' });

const connectAs = (userId) =>
  new Promise((resolve, reject) => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: socketToken(userId) },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true
    });
    clients.push(client);
    client.on('connect', () => resolve(client));
    client.on('connect_error', reject);
  });

// Resolves with the event payload, or null if it does not arrive in time
const waitFor = (client, event, ms = 400) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    client.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

const settle = () => new Promise((r) => setTimeout(r, 150));

const setupThread = async () => {
  const seller = await registerUser({ userType: 'seller' });
  const buyer = await registerUser({ userType: 'buyer' });
  const outsider = await registerUser({ userType: 'buyer' });
  const property = await Property.create(sampleProperty(seller.user._id));
  const thread = await Message.create({
    property: property._id,
    buyer: buyer.user._id,
    seller: seller.user._id,
    subject: 'Viewing',
    message: 'Is it still available?'
  });
  return { seller, buyer, outsider, threadId: thread._id.toString() };
};

describe('real-time message thread authorization', () => {
  it('lets participants join and exchange typing events', async () => {
    const { seller, buyer, threadId } = await setupThread();
    const sellerSocket = await connectAs(seller.user._id);
    const buyerSocket = await connectAs(buyer.user._id);

    sellerSocket.emit('join_message_thread', threadId);
    buyerSocket.emit('join_message_thread', threadId);
    await settle();

    const typing = waitFor(sellerSocket, 'user_typing');
    buyerSocket.emit('typing_start', { messageId: threadId });
    expect(await typing).toMatchObject({ messageId: threadId, isTyping: true });
  });

  it('refuses to let a non-participant join another conversation', async () => {
    const { outsider, threadId } = await setupThread();
    const outsiderSocket = await connectAs(outsider.user._id);

    const denied = waitFor(outsiderSocket, 'error');
    outsiderSocket.emit('join_message_thread', threadId);
    expect(await denied).toMatchObject({ message: 'Access denied to message thread' });

    // Server-side events for the thread must not reach the outsider
    const leaked = waitFor(outsiderSocket, 'new_message');
    socketServer.emitNewMessage({ messageId: threadId, message: 'private', sender: {} });
    expect(await leaked).toBeNull();
  });

  it('rejects malformed thread ids', async () => {
    const { outsider } = await setupThread();
    const outsiderSocket = await connectAs(outsider.user._id);

    const denied = waitFor(outsiderSocket, 'error');
    outsiderSocket.emit('join_message_thread', { $ne: null });
    expect(await denied).toMatchObject({ message: 'Access denied to message thread' });
  });

  it('ignores typing indicators and read receipts from non-participants', async () => {
    const { seller, outsider, threadId } = await setupThread();
    const sellerSocket = await connectAs(seller.user._id);
    const outsiderSocket = await connectAs(outsider.user._id);
    sellerSocket.emit('join_message_thread', threadId);
    await settle();

    const typing = waitFor(sellerSocket, 'user_typing');
    const read = waitFor(sellerSocket, 'message_read');
    outsiderSocket.emit('typing_start', { messageId: threadId });
    outsiderSocket.emit('mark_message_read', { messageId: threadId });

    expect(await typing).toBeNull();
    expect(await read).toBeNull();
  });

  it('does not let clients broadcast unpersisted messages', async () => {
    const { seller, buyer, threadId } = await setupThread();
    const sellerSocket = await connectAs(seller.user._id);
    const buyerSocket = await connectAs(buyer.user._id);
    sellerSocket.emit('join_message_thread', threadId);
    buyerSocket.emit('join_message_thread', threadId);
    await settle();

    const forged = waitFor(sellerSocket, 'new_message');
    buyerSocket.emit('send_message', { messageId: threadId, message: 'forged' });
    expect(await forged).toBeNull();
  });

  it('rejects connections from blocked or deactivated accounts', async () => {
    const { buyer } = await setupThread();
    await User.updateOne({ _id: buyer.user._id }, { isBlocked: true });
    await expect(connectAs(buyer.user._id)).rejects.toThrow('Authentication failed');

    await User.updateOne({ _id: buyer.user._id }, { isBlocked: false, isActive: false });
    await expect(connectAs(buyer.user._id)).rejects.toThrow('Authentication failed');
  });
});
