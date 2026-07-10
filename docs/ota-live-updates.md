# OTA Live Updates

Graham uses `@capgo/capacitor-updater` so approved iOS builds can receive web-layer updates without a new App Store binary.

## What OTA Can Change

- React UI
- CSS
- copy
- client-side business logic
- static assets included in the Vite build

## What Still Needs App Review

- native plugin changes
- iOS entitlements or permissions
- App Store product or payment behavior changes
- bundle identifier, signing, icons, splash screens, or native configuration
- changes that alter the app's primary purpose or advertised functionality

Apple allows downloaded interpreted code only when it does not change the app's primary purpose, bypass OS security, or create another app/storefront.

## First-Time Setup

1. Create the `com.graham.ai` app in Capgo.
2. Create `beta` and `production` channels.
3. Add a GitHub Actions secret named `CAPGO_TOKEN`.
4. Ship one normal App Store/TestFlight build with the updater included.

## Local Commands

```bash
npm run sync:ios
npm run ota:compat
npm run ota:upload:beta
npm run ota:upload
```

## GitHub Actions

Use the `OTA Live Update` workflow after the App Store build is approved. Start with `beta`, verify on device, then publish to `production`.

Do not use OTA to hide App Review-relevant changes. If a change touches native code, purchases, permissions, privacy disclosures, or app purpose, submit a new binary.
