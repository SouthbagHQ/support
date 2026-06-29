"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useState } from "react";
import Error from "./error";
import * as shenanigans from "./shenanigans";

export default function Footer() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <footer className="bg-blue-500 p-10">
      <div className="container mx-auto px-4">
        {submitted ? (
          <Error
            errorMessage="you didnt submit anything, maybe try writing something"
            actions={[
              { content: "Try again", onClick: () => setSubmitted(false) },
            ]}
          />
        ) : (
          <div>
            <h1>Submit feedback</h1>
            <Editor
              apiKey="your_api_key"
              initialValue="<p>Type your feedback here</p>"
              init={{
                height: 500,
                menubar: false,
                plugins: [
                  "advlist autolink lists link image charmap print preview anchor",
                  "searchreplace visualblocks code fullscreen",
                  "insertdatetime media table paste code help wordcount",
                ],
                toolbar:
                  "undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help",
              }}
            />
            <button
              onClick={() => {
                setSubmitted(true);
              }}
            >
              Submit
            </button>
          </div>
        )}
        {shenanigans.ENABLE &&
          Array(30)
            .fill(null)
            .map((_, index) => (
              <>
                {/*eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text*/}
                <img src={`/images/${index + 1}.png`} className="w-10 h-10" />
              </>
            ))}
        <div className="flex justify-between items-center">
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Southbag Support powered by
            Service Table. All rights reserved.
          </div>
          <div className="text-sm">
            <a
              href="https://github.com/ingoau/service-table"
              className="hover:underline"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
