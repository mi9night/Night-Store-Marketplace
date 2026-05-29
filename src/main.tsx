import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { CurrencyProvider } from "./lib/CurrencyContext";
import { UserNavProvider } from "./lib/UserNavContext";
import { applyStoredAppearance } from "./lib/usePrivacy";

// Применяем сохранённое оформление до первого рендера,
// чтобы весь сайт сразу открывался в выбранной полной теме без мигания Night-темы.
applyStoredAppearance();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrencyProvider>
      <UserNavProvider>
        <App />
      </UserNavProvider>
    </CurrencyProvider>
  </StrictMode>
);
