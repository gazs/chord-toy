"use client";

import { useEffect, useRef } from "react";
import clamp from "lodash/clamp";

export default function Strumplate({
  onSegmentStrum,
}: {
  onSegmentStrum: (i: number) => void;
}) {
  const numSegments = 3 * 4 + 1;

  const lastStrummedSegment = useRef<number | null>(null);

  const rect = useRef<DOMRect>();
  const strumplateDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (strumplateDiv.current) {
      rect.current = strumplateDiv.current.getBoundingClientRect();
    }
  }, [strumplateDiv]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (rect.current) {
      const strummedSegment = Math.round(
        clamp(
          ((e.clientY - rect.current.y) / rect.current?.height) * numSegments,
          0,
          numSegments
        )
      );
      if (strummedSegment != lastStrummedSegment.current) {
        lastStrummedSegment.current = strummedSegment;
        onSegmentStrum(strummedSegment);
      }
    }
  };

  return (
    <div
      ref={strumplateDiv}
      className="strumplate"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
    >
      {Array.from({ length: numSegments }).map((_, i) => (
        <div key={i} data-i={i} />
      ))}
    </div>
  );
}
