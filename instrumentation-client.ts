// Palantir — Southbag's PostHog wiring. Same project, proxy and settings as every other
// Southbag app (they load a shared `palantir.js`; this site uses the npm package because it
// already had it, plus @posthog/ai tracing on the server).
import posthog from "posthog-js";
import { PALANTIR_HOST, PALANTIR_KEY } from "@/lib/palantir-config";

posthog.init(PALANTIR_KEY, {
  api_host: PALANTIR_HOST,
  ui_host: "https://us.posthog.com",
  defaults: "2026-05-30",
  person_profiles: "always",
  cross_subdomain_cookie: true,
  persistence: "localStorage+cookie",
  capture_pageview: "history_change",
  capture_pageleave: true,
  autocapture: true,
  capture_heatmaps: true,
  capture_dead_clicks: true,
  capture_exceptions: true,
  capture_performance: { network_timing: true, web_vitals: true },
  rageclick: true,
  enable_recording_console_log: true,
  disable_session_recording: false,
  session_recording: {
    maskAllInputs: false,
    maskTextSelector: null,
    recordCrossOriginIframes: true,
    recordHeaders: true,
    recordBody: true,
  },
  debug: process.env.NODE_ENV === "development",
  loaded: (ph) => {
    ph.register({ southbag_app: "support" });
  },
});
