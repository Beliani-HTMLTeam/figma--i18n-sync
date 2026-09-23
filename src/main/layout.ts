import { VERTICAL_GAP } from "./constants";

export function stackedPosition(source: FrameNode, slot: number): Vector {
  return {
    x: source.x,
    y: source.y + slot * (source.height + VERTICAL_GAP),
  };
}
