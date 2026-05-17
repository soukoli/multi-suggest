"use client";

import "@/lib/icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { useLocationStore } from "@/store/useLocationStore";

function LocationInit() {
  const { requestLocation } = useLocationStore();
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocationInit />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
