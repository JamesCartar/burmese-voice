import { Copy, Save, Trash2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from './use-settings';
import { ModelPicker } from './model-picker';

export function SettingsPage() {
  const {
    showToolbar,
    settings,
    setSettings,
    state,
    apiKey,
    setApiKey,
    notice,
    busy,
    ready,
    save,
    copy,
    transcript,
    setTranscript,
  } = useSettings();
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Burmese Voice</h1>
        <p className="text-sm text-muted-foreground">
          Burmese + English • Ctrl + Alt + Space to toggle the mic
        </p>
        <Button variant="outline" onClick={() => void showToolbar()}>
          <Mic />
          Show toolbar
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Transcription settings</CardTitle>
          <CardDescription>
            Audio is sent to OpenRouter and the selected model provider. API
            usage costs credit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="api-key">
              OpenRouter API key{' '}
              {settings.hasKey ? '(configured)' : '(required)'}
            </Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Enter key locally; never paste it in chat"
            />
            <p className="text-xs text-muted-foreground">
              Encrypted with Windows safeStorage. Leave blank to keep the saved
              key.
            </p>
          </div>
          <ModelPicker
            value={settings.model}
            onChange={(model) => setSettings({ ...settings, model })}
          />
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="auto-insert">
              Insert text into the destination app
            </Label>
            <Switch
              id="auto-insert"
              checked={settings.autoInsert}
              onCheckedChange={(autoInsert) =>
                setSettings({ ...settings, autoInsert })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Click the destination text field before starting the mic. Keep that
            field selected until transcription finishes. Text is inserted
            without using your clipboard or pressing Enter. Focus checks cannot
            distinguish every browser field; do not use dictation in password or
            sensitive fields. Elevated apps may block input.
          </p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="continuous">Repeat recording automatically</Label>
            <Switch
              id="continuous"
              checked={settings.continuous}
              onCheckedChange={(continuous) =>
                setSettings({ ...settings, continuous })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Prototype: 15-second chunks, with a pause during transcription; not
            seamless streaming. Sessions stop after about 2 minutes to limit
            spending. When off, record up to 30 seconds. Mic is always off at
            launch.
          </p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="toolbar">Show floating toolbar on launch</Label>
            <Switch
              id="toolbar"
              checked={settings.showToolbar}
              onCheckedChange={(showToolbar) =>
                setSettings({ ...settings, showToolbar })
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !ready} onClick={() => void save()}>
              <Save />
              Save settings
            </Button>
            <Button
              variant="outline"
              disabled={busy || !ready || !settings.hasKey}
              onClick={() => void save(true)}
            >
              <Trash2 />
              Remove saved key
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Closing this window keeps the app in the tray. The toolbar × or tray
            Quit exits completely.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            A copy of each transcript is kept here for review or manual copying
            if insertion fails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="transcript" className="sr-only">
            Editable transcript
          </Label>
          <Textarea
            id="transcript"
            className="min-h-36 text-base leading-relaxed"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Your Burmese + English transcript appears here…"
          />
          <Button
            variant="outline"
            disabled={!transcript}
            onClick={() => void copy(transcript)}
          >
            <Copy />
            Copy transcript
          </Button>
          <p className="text-sm text-muted-foreground" role="status">
            {state.phase}: {state.message}
          </p>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground" role="status">
        {notice}
      </p>
    </main>
  );
}
