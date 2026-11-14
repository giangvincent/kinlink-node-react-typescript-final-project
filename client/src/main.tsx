import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

// One cache for the whole app, created once. A component asks for data by key;
// this client is what remembers the answer and, on invalidation, forgets it.
const queryClient = new QueryClient();

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
