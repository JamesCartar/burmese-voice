# Burmese Voice

## Why I built this

I often get messages from friends or coworkers while I'm busy doing something else and only have one hand free. Typing replies in Burmese with one hand is difficult, so I wanted a simple way to speak my response instead of typing it.

That's why I built **Burmese Voice**, a Windows 11 voice-typing app for Burmese and English. It's a **bring your own key (BYOK)** project: you connect your own OpenRouter API key, choose a model, and pay for your usage through your own account.

Built with Electron, React, TypeScript, Tailwind, CLI-generated shadcn components, the official OpenRouter SDK, and TanStack Query for the model catalog.

## Launch

Double-click **Burmese Voice** on the desktop. The shortcut runs the packaged executable under `out/burmese-voice-win32-x64`; keep that directory in place. No terminal, npm, or development server is required to run the packaged app.

Open Settings from the tray to enter an OpenRouter key, choose an audio-input or speech-to-text model, and save. Keys are encrypted with Electron safeStorage (Windows DPAPI) in the user profile. They are not returned to the renderer after saving. This does not protect against malicious software running as the same Windows user or an administrator.

## Dictation and insertion

1. Click the text field in your destination application.
2. Start recording with **Ctrl+Alt+Space** or the toolbar microphone.
3. Speak, then toggle again to stop and transcribe.
4. Keep the destination field selected until transcription finishes.

Automatic insertion is enabled by default and can be disabled in Settings. Native Windows Unicode input preserves your clipboard and does not press Enter. A transcript copy remains in Settings until the app exits.

Focus checks avoid typing into a different native window/control, but cannot distinguish every HTML field within a browser. Do not dictate into passwords or other sensitive fields. Administrator-level applications, secure desktops, some terminals, games, and apps that reject injected input may not accept text. Windows accepting input events is not proof that an application inserted the text. Check the destination before manually copying, especially after partial input failures.

The compact dark toolbar is always on top of normal windows. Drag its grip to move it. Closing Settings leaves the app in the tray; the toolbar **×** or tray **Quit** exits completely. The mic is off at launch.

Repeating mode uses 15-second recordings with gaps during transcription, not seamless streaming. It stops after approximately two minutes plus the final request. One-shot recording is capped at 30 seconds. Audio is sent to OpenRouter and its model provider and may consume credit. Burmese/English accuracy and accepted audio formats vary by model; this app currently records WebM/Opus. No automatic paid-request retries.

## Development

```sh
npm install
npm start
npm run typecheck
npm run lint
npm run desktop
```

`npm run desktop` builds the local app and creates/updates the desktop shortcut. Quit the packaged app before rebuilding. No installer, publishing pipeline, test suite, or background server is required.

Business logic lives in services and the dictation controller. Electron windows/IPC live in `src/main`, the narrow preload bridge in `src/preload.ts`, shared contracts in `src/shared`, and feature UI/hooks in `src/renderer/features`. Generated shadcn components live in `src/components/ui`.
