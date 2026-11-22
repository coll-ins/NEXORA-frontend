/* Turns mock mode on. It must be the FIRST import in dev/main.jsx, because lib/http.js reads the flag once, when it loads. */
window.__NEXORA_MOCK__ = true;
