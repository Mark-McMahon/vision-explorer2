import React, { useRef, useEffect, useCallback } from "react";
import type { TrackedObject } from "../types/index";
import { useStore } from "../store/useStore";
import CollapsedPill from "./CollapsedPill";
import ExpandedCard from "./ExpandedCard";

interface Props {
  obj: TrackedObject;
  top: number; // collision-adjusted Y position
}

function ObjectOverlay({ obj, top }: Props) {
  const toggleExpanded = useStore((s) => s.toggleExpanded);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-outside handler to collapse expanded card
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        obj.isExpanded &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        toggleExpanded(obj.trackId);
      }
    },
    [obj.isExpanded, obj.trackId, toggleExpanded]
  );

  useEffect(() => {
    if (obj.isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [obj.isExpanded, handleClickOutside]);

  return (
    <div
      ref={containerRef}
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
      {/* Expand/collapse wrapper */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: obj.isExpanded ? 600 : 40,
          transition: "max-height 300ms ease-out",
        }}
      >
        {obj.isExpanded ? <ExpandedCard obj={obj} /> : <CollapsedPill obj={obj} />}
      </div>
    </div>
  );
}

export default React.memo(ObjectOverlay);
