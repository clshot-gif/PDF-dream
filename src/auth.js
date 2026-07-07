import { GOOGLE_CLIENT_ID, DRIVE_SCOPE } from './config.js';

let tokenClient = null;
let accessToken = null;
let scriptLoadPromise = null;

// Loads the Google Identity Services script on demand and waits for it,
// rather than relying on a <script async> tag racing our module script —
// that race is timing-dependent and can lose on a slow connection.
function loadGsiScript() {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google sign-in script'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export async function initAuth() {
  await loadGsiScript();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: () => {}, // overridden per-call by signIn()
  });
}

export function signIn() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function signOut() {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}
