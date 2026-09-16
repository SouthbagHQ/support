"use client";

import { AIButton } from "@/components/ai-button";
import Loading from "@/components/loading";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import posthog from "posthog-js";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <>
        <Loading />
      </>
    );
  }

  return (
    <div>
      <h1>Log in Page</h1>
      <div className="flex flex-col w-fit p-10 mx-auto">
        Username
        <input
          onPaste={(e) => {
            e.preventDefault();
          }}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-protonpass-ignore="true"
        />
        Password
        <input
          onPaste={(e) => {
            e.preventDefault();
          }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-protonpass-ignore="true"
        />
        {showPassword && <p className="m-0 bg-gray-200 p-2">{password}</p>}
        <div className="flex flex-row">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          Show password
        </div>
        <button
          className="p-2 rounded-full"
          onClick={async () => {
            setLoading(true);
            const { data, error } = await authClient.signIn.username({
              username,
              password,
            });
            setLoading(false);
            if (error) {
              alert(error.message);
              posthog.capture("user_sign_in_failed", {
                error_message: error.message,
              });
            } else {
              // Identify by the stable user id; the username is a person property.
              if (data?.user) {
                posthog.identify(data.user.id, {
                  support_username: username,
                  email: data.user.email,
                  name: data.user.name,
                  support_account: true,
                });
              }
              // Capture successful login event
              posthog.capture("user_signed_in", {
                username: username,
              });
              alert("Logged in");
              location.href = "/";
            }
          }}
        >
          Create session
        </button>
        <a href="/forgot">Forgot password</a>
      </div>
    </div>
  );
}
