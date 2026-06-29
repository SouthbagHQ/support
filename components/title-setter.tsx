"use client";

import { useEffect } from "react";

// This is here to make sure the title is correct

export default function TitleSetter() {
  useEffect(() => {
    setTimeout(() => {
      setInterval(() => {
        document.title = "Southbag Support powered by Service Table";
      }, 1);
    }, 100);
  }, []);

  return <></>;
}
