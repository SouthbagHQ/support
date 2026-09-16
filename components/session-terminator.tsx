"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { track } from "@/lib/palantir";

export default function SessionTerminator() {
  const [remainingTime, setRemainingTime] = useState(100);

  const session = authClient.useSession();

  useEffect(() => {
    const timer = setTimeout(() => {
      setRemainingTime((prevTime) => prevTime - 1);
    }, 1000);

    if (remainingTime < 0 && Math.random() > 0.75 && session.data) {
      track("support_session_terminated", { after_seconds: 100 - remainingTime });
      authClient.signOut();
      location.reload();
    }

    return () => clearTimeout(timer);
  }, [remainingTime, session.data]);

  if (!session.data) return;

  return (
    <div
      className="fixed top-20 right-0 bg-red-500 p-4 z-100 animate-pulse"
      style={{ animationDuration: "500ms" }}
    >
      <p>
        For your security this Session will terminate in {remainingTime} seconds
      </p>
    </div>
  );
}
