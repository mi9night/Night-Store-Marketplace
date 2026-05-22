import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { CurrencyProvider } from "./lib/CurrencyContext";
import { UserNavProvider } from "./lib/UserNavContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrencyProvider>
      <UserNavProvider>
        <App />
      </UserNavProvider>
    </CurrencyProvider>
  </StrictMode>
);
