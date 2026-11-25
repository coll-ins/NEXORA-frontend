import { http, MOCK, mockDelay } from '../lib/http.js';

/* history: up to 6 earlier turns, [{ role: 'user' | 'assistant', text }]. Sends the Bearer token when there is one. */
export async function sendChat(message, history) {
  if (MOCK) {
    await mockDelay();
    return { reply: 'This is a sample answer. Connect the API to talk to the real assistant.', signed_in: false };
  }
  return http.post('/assistant/chat', { body: { message, history } });
}
