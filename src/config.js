// Google OAuth "Web application" client ID for this tool.
//
// This is a DIFFERENT client type than the mobile app's Android OAuth client
// (see archive-capture/src/config/Config.js) — you need a new one.
//
// Create it in Google Cloud Console, project 526107030062 (same project the
// mobile app uses — sharing a project is fine, client IDs are independent):
//   APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
//   -> Application type: "Web application"
//   -> Authorized JavaScript origins: add both
//        http://localhost:5173          (local dev)
//        https://<wherever-this-is-hosted>   (e.g. a GitHub Pages URL)
//   -> Create, then paste the Client ID below.
//
// Like the mobile app's client ID, this value is a public identifier, not a
// secret — safe to commit. Because the Cloud project is still in "Testing"
// publishing status, Hannah's and Justina's Google accounts also need to be
// added under OAuth consent screen -> Test users (same step already done for
// the mobile app) before they can sign in here.
export const GOOGLE_CLIENT_ID = 'REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

// drive.file: access only to files/folders this app creates or that the user
// explicitly opens with it — never blanket access to their whole Drive.
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
