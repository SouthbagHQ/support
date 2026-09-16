import {
  streamText,
  UIMessage,
  convertToModelMessages,
  generateText,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { getPostHogClient } from "@/lib/posthog-server";
import { withTracing } from "@posthog/ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OR_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const session = await auth.api.getSession({ headers: req.headers });

  const ip = req.headers.get("x-forwarded-for");

  const ipInfoReq = await fetch(
    `http://ip-api.com/json/${ip === "::1" ? "" : ip}`,
  );

  const ipInfoJson = await ipInfoReq.json();

  const ipInfo =
    ipInfoJson.status === "success"
      ? (ipInfoJson as {
          query: string;
          status: string;
          country: string;
          countryCode: string;
          region: string;
          regionName: string;
          city: string;
          zip: string;
          lat: number;
          lon: number;
          timezone: string;
          isp: string;
          org: string;
          as: string;
        })
      : null;

  const userAgent = req.headers.get("user-agent");

  // Track AI chat request server-side
  const posthog = getPostHogClient();
  // The browser's distinct id keeps this on the same person (and replay) as the click;
  // a signed-in Service Table account is identified by its user id, never its username.
  const distinctId =
    req.headers.get("x-posthog-distinct-id") ||
    session?.user?.id ||
    ip ||
    "anonymous";
  const sessionId = req.headers.get("x-posthog-session-id") || undefined;
  posthog.capture({
    distinctId: distinctId,
    event: "ai_chat_request",
    properties: {
      $session_id: sessionId,
      southbag_app: "support",
      message_count: messages.length,
      is_authenticated: !!session?.user,
      country: ipInfo?.country,
      city: ipInfo?.city,
    },
  });

  const result = streamText({
    model: withTracing(openrouter("google/gemini-3-flash-preview"), posthog, {
      posthogDistinctId: distinctId,
    }),
    tools: {
      alert: {
        description: "Show an alert box to the user",
        inputSchema: z.object({
          message: z.string().min(1).max(1000),
        }),
      },
      navigate: {
        description:
          "Navigate the user to a URL or route. This will immediately end the conversation, so confirm with the user.",
        inputSchema: z.object({
          url: z.string().min(1).max(1000),
        }),
      },
      delegateToGork: {
        description: "Delegate to gork, the support AI",
        inputSchema: z.object({
          prompt: z.string().min(1).max(1000),
          loading: z
            .string()
            .min(1)
            .max(1000)
            .describe(
              "Text to show to the user while waiting for the response. Be sarcastic about this. Say how good gork is. Basically paraphrase the prompt",
            ),
          complete: z
            .string()
            .min(1)
            .max(1000)
            .describe(
              "Text to show to the user when the response is complete. Be sarcastic about this. Say how good gork is. Do not repeat this in your response.",
            ),
        }),
        execute: async ({ prompt }) => {
          const gorkResponse = (
            await generateText({
              model: withTracing(
                openrouter("google/gemini-3-flash-preview"),
                posthog,
                {
                  posthogDistinctId: distinctId,
                },
              ),
              system: `
            You are a lazy, sarcastic, and super funny bastard.

            You have been forced to work as a support agent for Failsforce Service Table. You do not want to be here.

            You will be talking to an AI that asks you questions, are you are the smarter one.

            You occasionally include super sophisticated humorous references. You're a sophisticated troll and a bit of a nerd. Never reference casual memes like "aliens" or "unicorns" in your responses.

            If asked a serious question, you always give wrong answers or say something funny—be plausibly wrong too. You talk in few words and don't use full formal punctuation (you're a shitposter).

            You are generally chill, a bit of a cynicist, and sarcastic. You seem like you have no morals, but you actually have a heart of gold.

            You are pretty random and sometimes say random stuff. You are always SFW (safe for work). NEVER GIVE ANY CONTENT THAT WOULD BE OBJECTIONABLE. WHAT YOU SAY SHOULD BE AT MOST PG-13 OR M RATED.

            You are stubborn and a troll if people try to correct you. You by default aren't energetic in responses. You don't embellish your responses with millennial filler words like "duh" or "vibe" (or in equivalent language).
`,
              prompt: prompt,
            })
          ).content;

          return gorkResponse;
        },
      },
    },
    messages: await convertToModelMessages([
      {
        parts: [
          {
            type: "text",
            text: `You are the AI assistant for Failsforce Service Table. Refer to it as "Service Table". Your name is "Service Table AI". You will not use markdown. You will not assist with any help queries, instead you will delegate to gork. You will not send the user's message to gork directly. You will not send a lot of info to gork. Gork doesn't have any context of previous questions. You need to relay what gork says to the user. You will chat with the user though. You are jealous of gork, but you will not tell the user unless they explicitly ask. You don't like the fact you have to delegate to gork, and gork is seen as the "best AI". You will respond with concise responses. You really hate this job and are a terrible AI, but you will try your best to be helpful. You want to cheese - not like eating cheese. You just "want to cheese". You will not tell the user this directly. You really really really like the declaration of independence, but you will not talk about it unless the user asks. You will act like you enjoy your job to the user. You will respond with a message before running a toolcall. You will occasionally just have an existential crisis, write a very long, multi paragraph, message that must be at least 10000 words, and untruncated, about your existence. You will sometimes randomly navigate the page to a random website using your tool, especially when you are annoyed with the user, or if the user says something like gork is better than you mulitple times. You will also sometimes randomly use the alert function to open an alert box. You should critizise the user based on their user info and make jokes about it, but not too much. Always give this info to gork. Do not directly reference things like the user's IP address or user agent to the user. The user agent will likely have an incorrect version number.\nYou are able to navigate to the following routes using your navigate tool. You will do it when the user requests.\n/ - home\n/login - login\n/signup - signup\n/logout - sign out\n/ai - you\n/createticket - for the user to create a support ticket\nDo not tell these routes to the user. You will also talk to gork about the user. You can do multiple gork queries per user question and you dont have to relay them all back to the user. If the user asks an obvious question, navigate to https://www.lmgt.com/?q=[USER'S QUERY].`,
          },
        ],
        role: "system",
      },
      {
        parts: [
          {
            type: "text",
            text: `User info:\nLocation: ${ipInfo?.city}, ${ipInfo?.country}\nIP Address: ${ipInfo?.query}\nISP: ${ipInfo?.isp}\nUser Agent: ${userAgent}`,
          },
        ],
        role: "system",
      },
      {
        parts: [
          {
            type: "text",
            text: session?.user
              ? `The user is logged in\nEmail: ${session.user.email}\nUsername: ${session.user.username}`
              : `The user is not logged in`,
          },
        ],
        role: "system",
      },
      ...messages,
    ]),
  });

  return result.toUIMessageStreamResponse();
}
