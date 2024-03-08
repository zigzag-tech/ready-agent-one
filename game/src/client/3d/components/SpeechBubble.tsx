import { Html } from "@react-three/drei";
import React from "react";
import { HtmlProps } from "@react-three/drei/web/Html";

export function SpeechBubble({
  content,
  ...rest
}: { content?: string } & HtmlProps) {
  return (
    content && (
      <Html {...rest}>
        <div
          style={{
            fontFamily: "comic sans ms",
            // all uppercase
            textTransform: "uppercase",
            backgroundColor: "white",
            padding: "10px",
            maxWidth: "200px",
            borderRadius: "10px",
            border: "1px solid black",
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {content}
        </div>
      </Html>
    )
  );
}
