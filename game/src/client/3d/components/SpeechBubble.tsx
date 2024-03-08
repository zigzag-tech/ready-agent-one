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
            backgroundColor: "white",
            padding: "10px",
            width: "200px",
            height: "100px",
            borderRadius: "10px",
            border: "1px solid black",
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {content}
        </div>
      </Html>
    )
  );
}
