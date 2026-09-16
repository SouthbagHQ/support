"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  identify,
  identitySessionUser,
  resetIfIdentified,
  type PalantirUser,
} from "@/lib/palantir";

/**
 * Keeps PostHog's identity in step with who is signed in. Southbag Identity (the shared
 * `.southbag.cc` cookie) wins so the person lines up with every other Southbag app; a
 * Service Table account on its own identifies by its Better Auth user id. Only a confirmed
 * "signed out everywhere" resets a previously identified profile.
 */
export default function PalantirIdentity() {
  const session = authClient.useSession();
  const [identityUser, setIdentityUser] = useState<PalantirUser | null | undefined>();
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    identitySessionUser().then((user) => {
      setIdentityUser(user);
      setAsked(true);
    });
  }, []);

  useEffect(() => {
    if (!asked || session.isPending) return;
    const local = session.data?.user as
      | { id: string; email?: string | null; name?: string | null; username?: string | null }
      | undefined;

    if (identityUser) {
      identify(identityUser, {
        southbag_identity: true,
        ...(local ? { support_user_id: local.id, support_username: local.username ?? undefined } : {}),
      });
    } else if (local) {
      identify({ id: local.id, email: local.email, name: local.name, username: local.username }, {
        support_account: true,
      });
    } else if (identityUser === null) {
      resetIfIdentified();
    }
  }, [asked, identityUser, session.isPending, session.data]);

  return null;
}
