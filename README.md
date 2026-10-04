# Videos — offline TikTok-style iPhone app

This is a small offline-first web app (PWA) designed for iPhone. It uses IndexedDB to keep imported video files and comments on the device.

## What it does
- Full-screen vertical video feed
- Swipe up/down like TikTok
- Imports videos from the iPhone Files/Photos picker
- Videos can be watched without internet after they are stored
- Local likes and comments
- No account and no server

## Run it on Windows for testing
A service worker needs HTTPS or localhost. The easiest test is a local web server.

If Python is installed:
    python -m http.server 8080

Then open:
    http://localhost:8080

For an iPhone, the site must be served from an HTTPS address reachable by the phone. Upload this folder to a static HTTPS host, open it in Safari, then use Share -> Add to Home Screen.

## Important
This first version is a PWA, not a signed App Store .ipa. That is intentional: it lets you use the app on an iPhone without Xcode or a Mac. Later, the same design can be turned into a native iOS app with a proper Apple-signed build.

The supplied image is used as the app icon reference in this prototype.
