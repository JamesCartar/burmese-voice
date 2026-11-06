import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toolbar } from './renderer/features/toolbar/toolbar';
import { SettingsPage } from './renderer/features/settings/settings-page';
import './index.css';

const toolbar = window.location.hash === '#toolbar';
if (toolbar) document.body.classList.add('bg-transparent', 'overflow-hidden');
const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    {toolbar ? <Toolbar /> : <SettingsPage />}
  </QueryClientProvider>,
);
