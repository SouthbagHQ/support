"use client";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import * as shenanigans from "@/components/shenanigans";
import { Spinner } from "@/components/ui/spinner";
import Loading from "@/components/loading";
import posthog from "posthog-js";

function AIChat() {
  const chat = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      console.log(toolCall);
      if (toolCall.toolName === "alert") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        alert(toolCall.input.message);

        chat.addToolOutput({
          toolCallId: toolCall.toolCallId,
          tool: "alert",
          output: "yes",
        });
      }
      if (toolCall.toolName === "navigate") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.open(toolCall.input.url, "_self");

        chat.addToolOutput({
          toolCallId: toolCall.toolCallId,
          tool: "navigate",
          output: "yes",
        });
      }
    },
    transport: new DefaultChatTransport({
      headers: {
        "x-posthog-distinct-id": posthog.get_distinct_id(),
      },
    }),
  });
  const [enteredText, setEnteredText] = useState("Enter message here...");
  const queryParams = useSearchParams();

  useEffect(() => {
    if (queryParams.get("query")) {
      chat.sendMessage({ text: queryParams.get("query")! });
    }
  }, [queryParams]);

  return (
    <div className="p-4 flex flex-col gap-2">
      <h1>AI</h1>
      {chat.messages.map((message) => {
        return (
          <div key={message.id} className="flex flex-col gap-2">
            <AnimatePresence>
              {message.parts.map((part, index) => {
                if (part.type == "text")
                  return (
                    <motion.div
                      animate={{ x: 0 }}
                      initial={{ x: -100 }}
                      transition={{ duration: 1, ease: "linear" }}
                      key={index}
                      className={cn(
                        "w-fit rounded-full py-2",
                        message.role === "assistant"
                          ? "bg-blue-200 max-w-4xl rounded-bl-none"
                          : "bg-gray-200 ml-auto rounded-br-none",
                      )}
                    >
                      <p className="block translate-x-6 p-0 m-0 whitespace-pre-line">
                        {part.text}
                      </p>
                    </motion.div>
                  );
                if (part.type == "tool-delegateToKevin")
                  return (
                    <motion.div
                      className="border w-fit rounded-full"
                      key={index}
                    >
                      <details>
                        <summary>
                          <p className="block translate-x-5 p-0 m-0">
                            {part.state !== "output-available" && <Spinner />}
                            {(part.input as { loading: string })?.loading}
                            <br />
                            {(part.state === "output-available" &&
                              (part.input as { complete: string })?.complete) ||
                              ""}
                          </p>
                        </summary>
                        Prompt: {(part.input as { prompt: string })?.prompt}
                        <br />
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
                        {(part.output as any) &&
                          (
                            part.output as {
                              id: string;
                              text: string;
                              type: string;
                            }[]
                          ).map(
                            (output: {
                              id: string;
                              text: string;
                              type: string;
                            }) => {
                              if (output.type === "text") {
                                return <p key={output.id}>{output.text}</p>;
                              }
                            },
                          )}
                      </details>
                    </motion.div>
                  );
              })}
            </AnimatePresence>
          </div>
        );
      })}
      <div className="flex flex-row w-screen">
        <input
          type="text"
          value={enteredText}
          onChange={(e) => setEnteredText(e.target.value)}
          className="w-full p-4"
          onKeyDown={shenanigans.onKeyDown}
        />
        <button
          className="w-full"
          onClick={() => {
            posthog.capture("ai_message_sent", {
              message_length: enteredText.length,
              total_messages: chat.messages.length,
            });
            chat.sendMessage({ text: enteredText });
            setEnteredText("Enter message here...");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          <Loading />
        </div>
      }
    >
      <AIChat />
    </Suspense>
  );
}
