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

  const passwordRequirements: {
    check: (password: string) => boolean;
    text: string;
  }[] = [
    {
      text: "Password must be at least 8 characters long",
      check: (password: string) => password.length >= 8,
    },
    {
      text: "Password may not contain spaces",
      check: (password: string) => !password.includes(" "),
    },
    {
      text: "Password must contain at least one uppercase letter",
      check: (password: string) => /[A-Z]/.test(password),
    },
    {
      text: "Password must contain at least one lowercase letter",
      check: (password: string) => /[a-z]/.test(password),
    },
    {
      text: "Password must contain at least one number",
      check: (password: string) => /[0-9]/.test(password),
    },
    {
      text: "Password must contain at least one special character",
      check: (password: string) =>
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
    {
      text: "Password must not contain the letter g",
      check: (password: string) => !password.toLowerCase().includes("g"),
    },
    {
      text: "Password must not contain 6 or 7",
      check: (password: string) =>
        !password.toLowerCase().includes("6") &&
        !password.toLowerCase().includes("7"),
    },
    {
      text: 'Password must contain "kevin"',
      check: (password: string) => password.toLowerCase().includes("kevin"),
    },
    {
      text: "Password cannot contain the word 'password'",
      check: (password: string) => !password.toLowerCase().includes("password"),
    },
    {
      text: "Password has a limit of 10 characters",
      check: (password: string) => password.length <= 10,
    },
  ];

  return (
    <div>
      <h1>Signup Page</h1>
      <div className="flex flex-col w-fit p-10 mx-auto">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-protonpass-ignore="true"
        />
        Username
        <input
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-protonpass-ignore="true"
        />
        <AIButton
          text="Generate Password with AI"
          onClick={() => {
            location.href =
              "/ai?query=" +
              encodeURIComponent(
                `Make password that meets these requirements: ${passwordRequirements.map((req) => req.text).join(" ")}`,
              );
          }}
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
        <h2>
          Your security is our priority, so we have implemented password rules
        </h2>
        <div className="flex flex-col gap-2 p-4">
          {passwordRequirements.map((requirement, index) => (
            <p
              key={index}
              className={cn(
                "m-0 p-2",
                requirement.check(password) ? "bg-green-300" : "bg-red-300",
              )}
            >
              {requirement.text}
            </p>
          ))}
        </div>
        <button
          className="p-2 rounded-full"
          onClick={async () => {
            for (const requirement of passwordRequirements) {
              if (!requirement.check(password)) {
                alert(
                  `Password does not meet requirement: ${requirement.text}`,
                );
                return;
              }
            }
            setLoading(true);
            const { error } = await authClient.signUp.email({
              email,
              username,
              password,
              name: email,
            });
            setLoading(false);
            if (error) {
              alert(error.message);
              posthog.capture("user_sign_up_failed", {
                error_message: error.message,
              });
            } else {
              // Identify user in PostHog
              posthog.identify(username, {
                username: username,
                email: email,
              });
              // Capture successful signup event
              posthog.capture("user_signed_up", {
                username: username,
                email: email,
              });
              alert("Account created successfully!");
              location.href = "/login";
            }
          }}
        >
          Create account
        </button>
      </div>
    </div>
  );
}
