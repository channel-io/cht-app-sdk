import React from "react";
import ReactDOM from "react-dom/client";
import { WamProvider } from "@channel.io/app-sdk-wam";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <WamProvider>
      <App />
    </WamProvider>
  </React.StrictMode>
);
