"use client";

import posthog from "posthog-js";
import { IDENTITY_ORIGIN } from "./palantir-config";

export type PalantirUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

/** Custom event. Safe to call anywhere on the client. */
export function track(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}

/**
 * The Southbag Identity session, if the visitor has one. Identity's cookie lives on
 * `.southbag.cc`, so it's sent along with `credentials: "include"` and Identity's CORS
 * trusts every *.southbag.cc origin. `null` means Identity confirmed there's no session;
 * `undefined` means we couldn't ask.
 */
export async function identitySessionUser(): Promise<PalantirUser | null | undefined> {
  try {
    const response = await fetch(`${IDENTITY_ORIGIN}/api/auth/get-session`, {
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as { user?: PalantirUser } | null;
    return body?.user?.id ? body.user : null;
  } catch {
    return undefined;
  }
}

/** Identify with a stable user id (never a username) plus whatever we know about them. */
export function identify(user: PalantirUser, extra: Record<string, unknown> = {}) {
  const props: Record<string, unknown> = { ...extra };
  if (user.email) props.email = user.email;
  if (user.name) props.name = user.name;
  if (user.username) props.support_username = user.username;
  posthog.identify(String(user.id), props);
}

export function resetIfIdentified() {
  if (posthog.get_property("$user_state") === "identified") posthog.reset();
}
