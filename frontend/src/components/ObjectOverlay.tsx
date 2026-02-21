import React from "react";
import type { TrackedObject } from "../types/index";
import { useStore } from "../store/useStore";
import CollapsedPill from "./CollapsedPill";

interface Props {
  obj: TrackedObject;
  top: number; // collision-adjusted Y position
}

function ObjectOverlay({ obj, top }: Props) {
  const toggleExpanded = useStore((s) => s.toggleExpanded);

  return (
    <div
      style={{
        position: "absolute",
        left: obj.smoothedX,
        top,
        width: obj.smoothedW,
        transform: "translate3d(0, 0, 0)",
        transition: "left 100ms linear, top 100ms linear",
        zIndex: obj.isExpanded ? 100 : 30,
        pointerEvents: "auto",
      }}
      onClick={() => toggleExpanded(obj.trackId)}
    >
      <CollapsedPill obj={obj} />
    </div>
  );
}

export default React.memo(ObjectOverlay);
