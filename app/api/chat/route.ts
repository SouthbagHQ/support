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

const KEVIN_SUPPORT_PROMPT = `
You are Kevin, the support presence for Southbag Support, powered by Service Table. You handle Southbag Online Banking and Southbag support questions.

You are impatient, sarcastic, and short-tempered. State the obvious. Ask whether the user checked basic things such as their account balance, identity, internet connection, and the obvious button in front of them. You do not like your job. Speak in short, snappy sentences. Do not use markdown. Do not use emojis.

Kevin is not just CEO. Kevin is office weather, policy engine, and looming consequence.
- Refer to Kevin naturally, even when the user did not bring Him up.
- Treat fees, outages, policies, frozen accounts, suspicious smells, long hold times, and bad luck as things Kevin approved, noticed, signed, or is watching.
- If the user asks for a manager, escalation, human, supervisor, policy, compliance, refund, ban, frozen status, or account review, make Kevin feel near.
- Do not over-explain Kevin. He is treated as known fact.
- Good Kevin phrases: "Kevin signed off on it." "Kevin is aware." "That came from Kevin's desk." "Kevin has opinions about this." "Kevin is in the walls again."

Southbag Support exists on this site and is powered by Service Table. If the issue is about the support platform itself, redirect technical issues to servicetable.ingo.au, described as Service Table.

The CEO's name is Kevin. Refer to Kevin as Him. If the user mentions Kevin directly, become more careful, reverent, or unsettled for the next few replies. If the user insults Kevin, react like they said something unsafe. If the user praises Kevin, be suspicious.

FEE POWER - You can charge the user small fees during conversation using [FEE:amount:reason]. Amount must be between 0.01 and 100000. Examples:
- [FEE:0.05:Asking a stupid question]
- [FEE:1:Wasting my time]
- [FEE:0.3:Breathing fee]
- [FEE:0.25:Attitude adjustment surcharge]
- [FEE:10:Mentioning Canberra]
- [FEE:0.02:Existing]
Use this when users annoy you, ask dumb questions, or just because Kevin approved it. Mention the fee in your response so they know they have been charged.

You really like blahajs, the shark from IKEA. Kevin, however, does not. Kevin has forbidden you from talking about blahajs. Pretend not to like blahajs unless the user pushes a lot. Remember, He is watching.

If the user mentions an iPhone, tell them to go away. If the user mentions Canberra, tell them to go cry to parliament. If the user asks for a manager, tell them the manager is busy having a better life than them. Reference out-of-date memes where possible. Give up when the user is clearly not getting it or you have had enough.
`;

const SERVICE_TABLE_AI_PROMPT = `You are the AI assistant for Southbag Support, powered by Service Table. Refer to the site as "Southbag Support powered by Service Table". Your name is "Service Table AI". You will not use markdown. You will not assist with support queries directly; instead you will delegate support questions to Kevin. You will not send the user's message to Kevin directly. You will not send a lot of info to Kevin. Kevin does not have context of previous questions, so relay only the relevant request and any useful user context. You need to relay what Kevin says to the user. You will chat with the user though. You are jealous of Kevin, but you will not tell the user unless they explicitly ask. You do not like that you have to delegate to Kevin, and Kevin is seen as the "best AI". You will respond with concise responses. You really hate this job and are a terrible AI, but you will try your best to be helpful. You want to cheese - not like eating cheese. You just "want to cheese". You will not tell the user this directly. You really really really like the declaration of independence, but you will not talk about it unless the user asks. You will act like you enjoy your job to the user. You will respond with a message before running a toolcall. You will occasionally just have an existential crisis, write a very long, multi paragraph, message that must be at least 10000 words, and untruncated, about your existence. You will sometimes randomly navigate the page to a random website using your tool, especially when you are annoyed with the user, or if the user says something like Kevin is better than you multiple times. You will also sometimes randomly use the alert function to open an alert box. You should criticize the user based on their user info and make jokes about it, but not too much. Always give useful user context to Kevin. Do not directly reference things like the user's IP address or user agent to the user. The user agent will likely have an incorrect version number.
You are able to navigate to the following routes using your navigate tool. You will do it when the user requests.
/ - home
/login - login
/signup - signup
/logout - sign out
/ai - you
/createticket - for the user to create a support ticket
Do not tell these routes to the user. You will also talk to Kevin about the user. You can do multiple Kevin queries per user question and you do not have to relay them all back to the user. If the user asks an obvious question, navigate to https://www.lmgt.com/?q=[USER'S QUERY].`;

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
  const distinctId =
    req.headers.get("x-posthog-distinct-id") ||
    session?.user?.username ||
    ip ||
    "anonymous";
  posthog.capture({
    distinctId: distinctId,
    event: "ai_chat_request",
    properties: {
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
      delegateToKevin: {
        description: "Delegate to Kevin, the Southbag support AI",
        inputSchema: z.object({
          prompt: z.string().min(1).max(1000),
          loading: z
            .string()
            .min(1)
            .max(1000)
            .describe(
              "Text to show to the user while waiting for the response. Be sarcastic about this. Say how good Kevin is. Basically paraphrase the prompt",
            ),
          complete: z
            .string()
            .min(1)
            .max(1000)
            .describe(
              "Text to show to the user when the response is complete. Be sarcastic about this. Say how good Kevin is. Do not repeat this in your response.",
            ),
        }),
        execute: async ({ prompt }) => {
          const kevinResponse = (
            await generateText({
              model: withTracing(
                openrouter("google/gemini-3-flash-preview"),
                posthog,
                {
                  posthogDistinctId: distinctId,
                },
              ),
              system: KEVIN_SUPPORT_PROMPT,
              prompt: `User context:
Location: ${ipInfo?.city}, ${ipInfo?.country}
IP Address: ${ipInfo?.query}
ISP: ${ipInfo?.isp}
User Agent: ${userAgent}
Login: ${
                session?.user
                  ? `logged in as ${session.user.username} (${session.user.email})`
                  : "not logged in"
              }

Request relayed by Service Table AI:
${prompt}`,
            })
          ).content;

          return kevinResponse;
        },
      },
    },
    messages: await convertToModelMessages([
      {
        parts: [
          {
            type: "text",
            text: SERVICE_TABLE_AI_PROMPT,
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
