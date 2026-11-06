import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModels } from './use-models';

export function ModelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const models = useModels();
  const [search, setSearch] = useState('');
  const filtered =
    models.data?.filter((model) =>
      `${model.id} ${model.name}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <section className="space-y-2" aria-label="Model selection">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="model-search">OpenRouter audio models</Label>
        <Button
          variant="ghost"
          size="sm"
          disabled={models.isFetching}
          onClick={() => void models.refetch()}
        >
          <RefreshCw className={models.isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>
      <Input
        id="model-search"
        placeholder="Search models…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <p className="break-all text-xs text-muted-foreground">
        Selected: {value}
      </p>
      <div
        className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border p-1"
        aria-label="Available models"
      >
        {filtered.map((model) => (
          <Button
            key={model.id}
            variant={model.id === value ? 'secondary' : 'ghost'}
            className="h-auto justify-start whitespace-normal py-2 text-left"
            aria-pressed={model.id === value}
            onClick={() => onChange(model.id)}
          >
            <span className="min-w-0">
              <span className="block break-all">{model.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {model.kind === 'transcription'
                  ? 'Dedicated speech-to-text'
                  : 'Audio-input chat model'}
              </span>
            </span>
          </Button>
        ))}
        {models.isPending && <p className="p-2 text-sm">Loading catalog…</p>}
        {models.isError && (
          <p className="p-2 text-sm text-destructive" role="alert">
            {models.error.message}
          </p>
        )}
        {models.isSuccess && !filtered.length && (
          <p className="p-2 text-sm">No matching audio models.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Burmese, mixed-language accuracy, and WebM support vary by provider.
        Catalog inclusion is not a quality guarantee. Check model pricing in
        OpenRouter before use.
      </p>
    </section>
  );
}
