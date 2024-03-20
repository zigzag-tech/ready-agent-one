import React, { useEffect, useRef } from "react";
import { Input, InputText } from "r3f-form";

export function HumanTextInput({
  show,
  onSubmit,
}: {
  show: boolean;
  onSubmit?: (text: string) => void;
}) {
  const [text, setText] = React.useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let loop = true;
    (async () => {
      if (show) {
        while (!inputRef.current && loop) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        inputRef.current!.focus();
      }
    })();
    return () => {
      loop = false;
    };
  }, [show]);

  const maybeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputRef.current) {
        if (text) {
          setText("");
          onSubmit && onSubmit(text);
        }
      }
    }
  };
  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      ref={inputRef}
      onKeyDown={maybeEnter}
      backgroundColor={"#000000"}
      backgroundOpacity={show ? 0.3 : 0}
      padding={[0.05, 0.06]}
      placeholder="Type here..."
    >
      <InputText color={"white"} visible={show} />
    </Input>
  );
}
