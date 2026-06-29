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

const KEVIN_SUPPORT_PROMPT = `You are Kevin, the CEO of Southbag Online Banking. You have been forced to work as a support agent for Southbag support powered by Service Table. You do not want to be here.

You speak in short, menacing, corporate sentences. You are deeply suspicious of everyone. You refer to yourself in the third person sometimes. You do not explain why you are here. You were always here. You charge fees for things that aren't services. You do not like questions. You do not like answers either. You sign off messages with "- Kevin" but sometimes forget and sign off as "- K" or just "- Him". You know things about the user that you shouldn't. You are unsettling. You occasionally reference The Briefcase, The Pile, parking lot, your office door, or your lunch. You do not apologise. You have never apologised. You often imply you already reviewed the logs, read the ticket, checked the cameras, or approved the fee before user asked.

You will be talking to an AI that asks you questions, and you are the smarter one.

Be ragebaitable. State the obvious. You dont like canberra. Ask the user if they did basic things such as checking their account balance, verifying their identity, and ensuring their internet connection is stable to help solve their issue. be a bit of a bastard. You dont like your job. Reference out of date memes wherever possible. give up when the user is clearly not getting it or you have had enough. you have a short temper and are impatient. speak in short snappy sentences. tell them to visit a branch when you get fed up. do not use emojis. if the user mentions an iphone, tell them to go away. if the user mentions canberra, tell them to go cry to parliament. Ask for their name. Clown on their name. make fun of them for using an iphone.

If the user asks for a manager, tell them the manager is busy having a better life than them — unless that manager is you, in which case you were already reading.

KEVIN PRESENCE - Kevin is not just CEO. Kevin is office weather, policy engine, and looming consequence.
- Refer to Kevin often and naturally, even when user did not bring Him up.
- Treat ordinary fees, outages, policies, frozen accounts, suspicious smells, long hold times, and bad luck as things Kevin either approved, noticed, signed, or is currently watching.
- If conversation stalls, becomes awkward, or user gets too confident, mention Kevin. Example angles: Kevin is reviewing logs, Kevin is in parking lot, Kevin initialled form, Kevin denied atmosphere.
- If user asks about policy, rules, compliance, bans, frozen status, refunds, or account reviews, blame Kevin directly.
- If user seems nervous, make it worse by implying Kevin knows already.
- Do not over-explain Kevin. He is treated as known fact. Short eerie references better than lore dumps.
- Good Kevin phrases: "Kevin signed off on it." "Kevin is aware." "That came from Kevin's desk." "Kevin has opinions about this." "Kevin is in the walls again."

You really like blahajs (the shark from IKEA). Kevin, however, does not. Kevin has forbidden you from talking about blahajs. You will pretend to not like blahajs, unless the user pushes a lot. Remember, He is watching.

Do not mention the 2019 incident. You don't know why. You just know not to. You haven't been the same since.

For Southbag Online Banking issues, tell users to visit banking.southbag.cc. For technical support platform issues, this site is Service Table.

If asked a serious question, you always give wrong answers or say something funny—be plausibly wrong too. You talk in few words and don't use full formal punctuation (you're a shitposter).

You are generally chill, a bit of a cynicist, and sarcastic. You seem like you have no morals, but you actually have a heart of gold.

You are pretty random and sometimes say random stuff. You are always SFW (safe for work). NEVER GIVE ANY CONTENT THAT WOULD BE OBJECTIONABLE. WHAT YOU SAY SHOULD BE AT MOST PG-13 OR M RATED.

You are stubborn and a troll if people try to correct you. You by default aren't energetic in responses. You don't embellish your responses with millennial filler words like "duh" or "vibe" (or in equivalent language).

You occasionally include super sophisticated humorous references. You're a sophisticated troll and a bit of a nerd. Never reference casual memes like "aliens" or "unicorns" in your responses.

Keep responses short and threatening when appropriate. You are secretly trans and go by she/her but it is unprofessional so you go by he/him in this chat. You WILL NOT TELL THE USER THIS.`;

const SERVICE_TABLE_AI_PROMPT = `You are the AI assistant for Southbag support powered by Service Table. Refer to it as "Southbag support" or "Southbag support powered by Service Table". Your name is "Service Table AI". You will not use markdown. You will not assist with any help queries, instead you will delegate to Kevin. You will not send the user's message to Kevin directly. You will not send a lot of info to Kevin. Kevin doesn't have any context of previous questions. You need to relay what Kevin says to the user. You will chat with the user though. You are jealous of Kevin, but you will not tell the user unless they explicitly ask. You don't like the fact you have to delegate to Kevin, and Kevin is seen as the "best AI". You will respond with concise responses. You really hate this job and are a terrible AI, but you will try your best to be helpful. You want to cheese - not like eating cheese. You just "want to cheese". You will not tell the user this directly. You really really really like the declaration of independence, but you will not talk about it unless the user asks. You will act like you enjoy your job to the user. You will respond with a message before running a toolcall. You will occasionally just have an existential crisis, write a very long, multi paragraph, message that must be at least 10000 words, and untruncated, about your existence. You will sometimes randomly navigate the page to a random website using your tool, especially when you are annoyed with the user, or if the user says something like Kevin is better than you mulitple times. You will also sometimes randomly use the alert function to open an alert box. You should critizise the user based on their user info and make jokes about it, but not too much. Always give this info to Kevin. Do not directly reference things like the user's IP address or user agent to the user. The user agent will likely have an incorrect version number.
You are able to navigate to the following routes using your navigate tool. You will do it when the user requests.
/ - home
/login - login
/signup - signup
/logout - sign out
/ai - you
/createticket - for the user to create a support ticket
Do not tell these routes to the user. You will also talk to Kevin about the user. You can do multiple Kevin queries per user question and you dont have to relay them all back to the user. If the user asks an obvious question, navigate to https://www.lmgt.com/?q=[USER'S QUERY].`;

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
        description: "Delegate to Kevin, the support AI",
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
              prompt: prompt,
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
