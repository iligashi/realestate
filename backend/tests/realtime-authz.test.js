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

  it('relays read receipts only for replies that belong to the thread', async () => {
    const { seller, buyer, threadId } = await setupThread();
    const thread = await Message.findById(threadId);
    await thread.addReply(seller.user._id, 'Yes, it is');
    const ownReplyId = (await Message.findById(threadId)).thread[0]._id.toString();

    const other = await Message.create({
      property: thread.property,
      buyer: buyer.user._id,
      seller: seller.user._id,
      subject: 'Other',
      message: 'Different conversation'
    });
    await other.addReply(seller.user._id, 'Unrelated reply');
    const foreignReplyId = (await Message.findById(other._id)).thread[0]._id.toString();

    const sellerSocket = await connectAs(seller.user._id);
    const buyerSocket = await connectAs(buyer.user._id);
    sellerSocket.emit('join_message_thread', threadId);
    buyerSocket.emit('join_message_thread', threadId);
    await settle();

    const forged = waitFor(sellerSocket, 'message_read');
    buyerSocket.emit('mark_message_read', { messageId: threadId, threadMessageId: foreignReplyId });
    expect(await forged).toBeNull();

    const malformed = waitFor(sellerSocket, 'message_read');
    buyerSocket.emit('mark_message_read', { messageId: threadId, threadMessageId: { $ne: null } });
    expect(await malformed).toBeNull();

    const genuine = waitFor(sellerSocket, 'message_read');
    buyerSocket.emit('mark_message_read', { messageId: threadId, threadMessageId: ownReplyId });
    expect(await genuine).toMatchObject({ messageId: threadId, threadMessageId: ownReplyId });
  });

  it('keeps a user online and in their rooms while another device is still connected', async () => {
    const { seller, buyer, threadId } = await setupThread();
    const observer = await connectAs(seller.user._id);
    observer.emit('join_message_thread', threadId);

    const statusEvents = [];
    observer.on('user_status_change', (e) => {
      if (e.userId === String(buyer.user._id)) statusEvents.push(e.isOnline);
    });

    const phone = await connectAs(buyer.user._id);
    const laptop = await connectAs(buyer.user._id);
    phone.emit('join_message_thread', threadId);
    laptop.emit('join_message_thread', threadId);
    await settle();
    expect(statusEvents).toEqual([true]);

    phone.close();
    await settle();
    expect(socketServer.isUserOnline(buyer.user._id)).toBe(true);
    expect(statusEvents).toEqual([true]);
    expect(socketServer.messageRooms.get(threadId)?.has(String(buyer.user._id))).toBe(true);

    // The remaining device still receives thread events
    const delivered = waitFor(laptop, 'user_typing');
    observer.emit('typing_start', { messageId: threadId });
    expect(await delivered).toMatchObject({ messageId: threadId });

    laptop.close();
    await settle();
    expect(socketServer.isUserOnline(buyer.user._id)).toBe(false);
    expect(statusEvents).toEqual([true, false]);
  });

  it('rejects connections from blocked or deactivated accounts', async () => {
    const { buyer } = await setupThread();
    await User.updateOne({ _id: buyer.user._id }, { isBlocked: true });
    await expect(connectAs(buyer.user._id)).rejects.toThrow('Authentication failed');

    await User.updateOne({ _id: buyer.user._id }, { isBlocked: false, isActive: false });
    await expect(connectAs(buyer.user._id)).rejects.toThrow('Authentication failed');
  });
});
