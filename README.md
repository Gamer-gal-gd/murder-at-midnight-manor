# Murder at Midnight Manor — iOS + Android App

This is an **Expo React Native mobile application source project**, plus the existing Python multiplayer WebSocket server. It is not a signed APK/IPA, published app, or deployed service.

## Features
- iPhone and Android interface
- Private multiplayer rooms and 5-character join codes
- Host-controlled start for 2–6 detectives
- Five cooperative synchronized puzzles and shared evidence
- Hint system, four suspect profiles/names, murder-weapon selection
- Individual votes and a shared final verdict

## 1. Host the multiplayer server

The `server/` directory contains the Python aiohttp backend. Deploy it to Render, Railway, or another provider supporting Python and WebSockets.

- Root directory: `server`
- Build command: `pip install -r requirements.txt`
- Start command: `python server.py`
- Host must supply a `PORT` variable (server defaults to 8080 locally).
- Test your HTTPS deployment before proceeding.

**Caution:** The server is a prototype. Rooms are stored only in memory and disappear when the server restarts. Players cannot rejoin started rooms. Use a single server instance for testing. Before public launch add database-backed sessions, reconnect tokens, abuse prevention, moderation, and security hardening.

## 2. Configure the app

Edit `config.js` and replace `https://YOUR-SERVER-HOST.example.com` with the actual public HTTPS URL of your server. The app automatically uses `wss://.../ws` for the multiplayer connection.

## 3. Run on a phone (Expo Go)

Install Node.js 20.19+ and Expo Go. From this project directory:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on Android or the iPhone camera / Expo Go flow. Both your phone and computer should have working connectivity. Your deployed server must be accessible over the internet for friends in different locations.

## 4. Build installable apps

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Follow EAS prompts. Android preview builds can be installed on test devices. iOS device distribution requires Apple signing and provisioning, generally via a paid Apple Developer account. Production builds and store publication need their respective developer accounts, store review, privacy policy, and compliance work.

Expo documentation: https://docs.expo.dev/build/introduction/

## Current known limitations

- No built-in voice chat or account system.
- No reconnect support or persistent games.
- No push notifications.
- No production anti-cheat or access controls.
- UI and WebSocket integration are provided as source code; build and deployment have not been verified in this environment.
