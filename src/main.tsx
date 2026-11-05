import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/noto-sans-thai/400.css";
import "@fontsource/noto-sans-thai/500.css";
import "@fontsource/noto-sans-thai/600.css";
import "@fontsource/noto-sans-thai/700.css";
import "@xyflow/react/dist/style.css";
import "./style.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
