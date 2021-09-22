import ReconnectingWebSocket from 'reconnecting-websocket';
import WebSocket from 'ws';

export const coincap = new ReconnectingWebSocket(process.env.COINCAP_WS_URL, [], {
  WebSocket: WebSocket,
  connectionTimeout: 1000,
});

coincap.addEventListener('close', (event) => {
  if (!event.wasClean) {
    console.log('reconnect coincap stream');
  }
});

coincap.addEventListener('error', (event) => {
  console.log(event);
});
