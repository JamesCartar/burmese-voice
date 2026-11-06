import {
  GripVertical,
  LoaderCircle,
  Mic,
  Square,
  X,
  CircleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDictation } from '../dictation/use-dictation';

export function Toolbar() {
  const { state, toggle } = useDictation();
  const recording = state.phase === 'recording';
  const waiting = state.phase === 'starting' || state.phase === 'transcribing';
  return (
    <main
      className="dark flex h-8 w-24 items-center justify-center gap-1 rounded-lg border bg-background px-1 text-muted-foreground"
      aria-label="Voice typing toolbar"
    >
      <div
        className="window-drag flex h-6 w-4 items-center justify-center text-muted-foreground"
        title="Drag to move • Settings are in the system tray"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </div>
      <Button
        size="icon-xs"
        variant={recording ? 'destructive' : 'ghost'}
        onClick={() => void toggle()}
        aria-label={recording || waiting ? 'Stop dictation' : 'Start dictation'}
        aria-pressed={recording}
        title={state.message || 'Start dictation (Ctrl+Alt+Space)'}
      >
        {waiting ? (
          <LoaderCircle className="animate-spin" />
        ) : recording ? (
          <Square />
        ) : state.phase === 'error' ? (
          <CircleAlert />
        ) : (
          <Mic />
        )}
      </Button>
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={() => void window.voice.quit()}
        aria-label="Quit app"
        title="Quit app and stop microphone"
      >
        <X />
      </Button>
      <span className="sr-only" role="status">
        {state.message}
      </span>
    </main>
  );
}
