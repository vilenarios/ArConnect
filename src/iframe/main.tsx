import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Popup from "../popup";
import { setupBackgroundService } from "~api/background/background-setup";

import "../../assets/popup.css";

// TODO: Duplicate "Popup" as "Iframe" and move all routers to config to be able to combine Popup + Auth.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);

setupBackgroundService();

// TODO: Backend should expect a hash of any of the other key shards. Otherwise, won't send back its own shard.

// TODO: Add artificial wait time for auth request (by ip, not ip-account) to the backend if auth fails.

// TODO: Use the infra needed to implement the MPC wallets to also send notifications to wallets when someone
// is trying to access their account.
