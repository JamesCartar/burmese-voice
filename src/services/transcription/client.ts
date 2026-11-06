export async function createOpenRouterClient(apiKey?: string) {
  const { OpenRouter } = await import('@openrouter/sdk');
  return new OpenRouter({
    apiKey,
    appTitle: 'Burmese Voice',
    retryConfig: { strategy: 'none' },
  });
}

// Never expose SDK error bodies, headers, or request objects to the renderer.
export function providerError(error: unknown): Error {
  const status =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number(error.statusCode)
      : undefined;
  if (status === 401 || status === 403)
    return new Error(
      'OpenRouter rejected the credentials or access policy. Check your key and account settings.',
    );
  if (status === 402) return new Error('Insufficient OpenRouter credit.');
  if (status === 429)
    return new Error(
      'OpenRouter rate limit reached. Please wait before retrying.',
    );
  return new Error(
    `OpenRouter request failed${status ? ` (${status})` : ''}. Check your connection, model access, and audio-format support. No automatic retry was made.`,
  );
}
