import { useEffect, useRef } from "react";
import type { PluginMessage, UIMessage } from "../types";

export function postToPlugin(message: UIMessage): void {
  window.parent.postMessage({ pluginMessage: message }, "*");
}

export function usePluginMessages(
  onMessage: (message: PluginMessage) => void,
): void {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = event.data?.pluginMessage as PluginMessage | undefined;
      if (message) {
        handlerRef.current(message);
      }
    };

    window.addEventListener("message", listener);
    postToPlugin({ type: "REQUEST_SELECTION_FRAMES" });
    return () => window.removeEventListener("message", listener);
  }, []);
}
