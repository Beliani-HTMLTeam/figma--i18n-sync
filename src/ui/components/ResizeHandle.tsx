import { useRef, type PointerEvent } from "react";
import { postToPlugin } from "../lib/messaging";

const ResizeHandle = () => {
  const frame = useRef<number | null>(null);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !event.currentTarget.hasPointerCapture(event.pointerId) ||
      frame.current !== null
    ) {
      return;
    }
    const { clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      postToPlugin({
        type: "RESIZE_UI",
        width: clientX + 4,
        height: clientY + 4,
      });
    });
  };

  return (
    <div
      className="resizeHandle"
      aria-hidden="true"
      onPointerDown={(event) =>
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      onPointerUp={(event) =>
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      onPointerMove={onPointerMove}
    />
  );
};

export default ResizeHandle;
