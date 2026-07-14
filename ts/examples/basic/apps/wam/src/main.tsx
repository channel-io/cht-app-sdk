import React from "react";
import ReactDOM from "react-dom/client";
import { WamProvider } from "@channel.io/app-sdk-wam";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WamProvider>
      <App />
    </WamProvider>
  </React.StrictMode>
);
