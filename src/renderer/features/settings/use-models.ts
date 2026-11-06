import { useQuery } from '@tanstack/react-query';
import { unwrap } from '../../../shared/contracts';

export function useModels() {
  return useQuery({
    queryKey: ['openrouter', 'audio-models'],
    queryFn: async () => unwrap(await window.voice.models()),
    staleTime: 60000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
