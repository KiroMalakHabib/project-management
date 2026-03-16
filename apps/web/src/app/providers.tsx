'use client';

import { ApolloClientProvider } from '@/lib/apollo/provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloClientProvider>{children}</ApolloClientProvider>;
}
