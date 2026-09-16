"use client";

import { cn } from "@/lib/utils";
import { AIButton } from "./ai-button";
import { animate } from "animejs";
import { useEffect, useRef } from "react";
import * as shenanigans from "./shenanigans";
import { track } from "@/lib/palantir";

export default function SearchBox({ className }: { className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    animate(formRef.current as HTMLFormElement, {
      scale: [0.8, 1],
      y: [1000, 0],
      duration: 500,
      easing: "easeInOutQuad",
    });
  });

  return (
    <form className={cn("flex", className)} action="/ai" ref={formRef}>
      <input
        type="text"
        name="query"
        defaultValue="Search with AI"
        className={"p-2"}
        onKeyDown={(e) => {
          shenanigans.onKeyDown(e);
        }}
        onPaste={(e) => {
          e.preventDefault();
        }}
      />
      <AIButton
        text="Search using AI"
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onClick={(e) => {
          shenanigans.onClick(e);
          const query = (formRef.current?.elements.namedItem("query") as HTMLInputElement | null)?.value ?? "";
          track("support_search_submitted", { query, query_length: query.length });
          formRef.current?.submit();
        }}
      />
    </form>
  );
}
