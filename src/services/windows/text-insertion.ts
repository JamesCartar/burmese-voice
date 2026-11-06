import { setTimeout as delay } from 'node:timers/promises';
import {
  focusedTarget,
  sameTarget,
  restoreTarget,
  modifiersHeld,
  insertUnicode,
  isNativePasswordField,
  type FocusTarget,
} from './native-input';

export class TextInsertion {
  private previous?: FocusTarget;
  private target?: FocusTarget;
  private timer?: ReturnType<typeof setInterval>;
  constructor(private toolbarHandle: () => bigint) {}

  startTracking() {
    this.timer = setInterval(() => {
      const focus = focusedTarget();
      if (focus && focus.processId !== process.pid) this.previous = focus;
    }, 80);
  }
  dispose() {
    clearInterval(this.timer);
  }

  begin() {
    const current = focusedTarget();
    this.target = current?.processId === process.pid ? this.previous : current;
    if (this.target && current?.window === this.toolbarHandle())
      restoreTarget(this.target);
  }

  async insert(text: string): Promise<string> {
    const target = this.target;
    if (!target?.control)
      return 'No destination field found. Copy the transcript from settings.';
    if (text.length > 20000)
      return 'Transcript is too long for automatic insertion. Copy it from settings.';
    let current = focusedTarget();
    // A click on our Stop button is allowed to return focus to the original destination.
    // Never pull focus back from a different external app or the settings window.
    if (current?.window === this.toolbarHandle()) {
      restoreTarget(target);
      await delay(100);
      current = focusedTarget();
    }
    if (!sameTarget(current, target))
      return 'Destination focus changed. Text was not inserted; copy it from settings.';
    if (isNativePasswordField(target))
      return 'Automatic insertion is disabled for this password field.';
    for (let tries = 0; modifiersHeld() && tries < 100; tries++)
      await delay(20);
    if (modifiersHeld() || !sameTarget(focusedTarget(), target))
      return 'Keyboard or focus changed. Copy the transcript from settings.';
    if (!insertUnicode(text))
      return 'Windows blocked some or all text input. Check the destination before copying to avoid duplicates.';
    return 'Text sent to the destination. If that app did not accept it, copy the transcript from settings.';
  }
}
