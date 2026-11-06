import koffi from 'koffi';

const user32 = koffi.load('user32.dll');
const mouseInput = koffi.struct({
  dx: 'long',
  dy: 'long',
  mouseData: 'uint32_t',
  dwFlags: 'uint32_t',
  time: 'uint32_t',
  dwExtraInfo: 'uintptr_t',
});
const keyboardInput = koffi.struct({
  wVk: 'uint16_t',
  wScan: 'uint16_t',
  dwFlags: 'uint32_t',
  time: 'uint32_t',
  dwExtraInfo: 'uintptr_t',
});
const hardwareInput = koffi.struct({
  uMsg: 'uint32_t',
  wParamL: 'uint16_t',
  wParamH: 'uint16_t',
});
const input = koffi.struct('VOICE_INPUT', {
  type: 'uint32_t',
  value: koffi.union({
    mouse: mouseInput,
    keyboard: keyboardInput,
    hardware: hardwareInput,
  }),
});
const rect = koffi.struct({
  left: 'long',
  top: 'long',
  right: 'long',
  bottom: 'long',
});
const guiInfo = koffi.struct('VOICE_GUI_INFO', {
  cbSize: 'uint32_t',
  flags: 'uint32_t',
  hwndActive: 'uintptr_t',
  hwndFocus: 'uintptr_t',
  hwndCapture: 'uintptr_t',
  hwndMenuOwner: 'uintptr_t',
  hwndMoveSize: 'uintptr_t',
  hwndCaret: 'uintptr_t',
  rcCaret: rect,
});
const foregroundWindow = user32.func(
  'uintptr_t __stdcall GetForegroundWindow()',
);
const windowThread = user32.func(
  'uint32_t __stdcall GetWindowThreadProcessId(uintptr_t hwnd, _Out_ uint32_t *processId)',
);
const guiThreadInfo = user32.func(
  'int __stdcall GetGUIThreadInfo(uint32_t threadId, _Inout_ VOICE_GUI_INFO *info)',
);
const setForeground = user32.func(
  'int __stdcall SetForegroundWindow(uintptr_t hwnd)',
);
const getKeyState = user32.func('int16_t __stdcall GetAsyncKeyState(int key)');
const sendInput = user32.func(
  'uint32_t __stdcall SendInput(uint32_t count, VOICE_INPUT *inputs, int size)',
);
const getClassName = user32.func(
  'int __stdcall GetClassNameW(uintptr_t hwnd, void *name, int maxCount)',
);
const getStyle = user32.func(
  'long __stdcall GetWindowLongW(uintptr_t hwnd, int index)',
);

export interface FocusTarget {
  window: bigint;
  control: bigint;
  processId: number;
}
export function focusedTarget(): FocusTarget | undefined {
  const window = BigInt(foregroundWindow());
  if (!window) return undefined;
  const pid = [0];
  const thread = windowThread(window, pid);
  const info = {
    cbSize: koffi.sizeof(guiInfo),
    flags: 0,
    hwndActive: 0n,
    hwndFocus: 0n,
    hwndCapture: 0n,
    hwndMenuOwner: 0n,
    hwndMoveSize: 0n,
    hwndCaret: 0n,
    rcCaret: { left: 0, top: 0, right: 0, bottom: 0 },
  };
  if (!thread || !guiThreadInfo(thread, info)) return undefined;
  return { window, control: BigInt(info.hwndFocus), processId: pid[0] };
}
export function sameTarget(
  a: FocusTarget | undefined,
  b: FocusTarget | undefined,
) {
  return Boolean(
    a &&
    b &&
    a.window === b.window &&
    a.control === b.control &&
    a.processId === b.processId,
  );
}
export function restoreTarget(target: FocusTarget) {
  return Boolean(setForeground(target.window));
}
export function modifiersHeld() {
  return [0x10, 0x11, 0x12, 0x5b, 0x5c].some(
    (key) => (getKeyState(key) & 0x8000) !== 0,
  );
}
export function isNativePasswordField(target: FocusTarget) {
  const buffer = Buffer.alloc(512);
  const count = getClassName(target.control, buffer, 256);
  const name = buffer.toString('utf16le', 0, count * 2);
  return /edit/i.test(name) && (getStyle(target.control, -16) & 0x20) !== 0;
}
export function insertUnicode(text: string): boolean {
  // Unicode events support Burmese and surrogate pairs without changing keyboard layout.
  // Normalize control characters so dictation cannot submit forms or activate shortcuts.
  const events = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const safeCode = code < 32 || code === 127 ? 32 : code;
    for (const flags of [0x4, 0x6]) {
      events.push({
        type: 1,
        value: {
          keyboard: {
            wVk: 0,
            wScan: safeCode,
            dwFlags: flags,
            time: 0,
            dwExtraInfo: 0,
          },
        },
      });
    }
  }
  return (
    sendInput(events.length, events, koffi.sizeof(input)) === events.length
  );
}
