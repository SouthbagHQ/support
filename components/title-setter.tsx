"use client";

import { useEffect } from "react";

// This is here to make sure the title is correct

export default function TitleSetter() {
  useEffect(() => {
    setTimeout(() => {
      setInterval(() => {
        document.title = "Southbag support powered by service table";
      }, 1);
    }, 100);
  }, []);

  return <></>;
}
