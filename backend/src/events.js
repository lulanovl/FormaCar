/**
 * Simple Server-Sent Events broadcaster.
 * Admin clients connect to /api/events and receive push notifications
 * whenever orders are created or updated.
 */

const clients = new Set();

/**
 * Subscribe an SSE response to the broadcast channel.
 * Returns an unsubscribe function — call it on request close.
 */
function subscribe(res) {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering if behind proxy
  });
  // Initial ping so browser confirms connection
  res.write('event: connected\ndata: ok\n\n');

  clients.add(res);
  return () => clients.delete(res);
}

/**
 * Broadcast an SSE event to all connected admin clients.
 * @param {string} event  - event name
 * @param {object} data   - JSON-serialisable payload
 */
function broadcast(event, data) {
  if (clients.size === 0) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(msg);
    } catch {
      clients.delete(res);
    }
  }
}

module.exports = { subscribe, broadcast };
