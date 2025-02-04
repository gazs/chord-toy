"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clamp from "lodash/clamp";

export default function Strumplate({
  onSegmentStrum,
}: {
  onSegmentStrum: (i: number) => void;
}) {
  const numSegments = 3 * 4 + 1;

  const [lastStrummedSegment, setLastStrummedSegment] = useState<number | null>(
    null
  );

  const rect = useRef<DOMRect>();
  const strumplateDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (strumplateDiv.current) {
      rect.current = strumplateDiv.current.getBoundingClientRect();
    }
  }, [strumplateDiv]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (rect.current) {
        const strummedSegment = Math.round(
          clamp(
            ((e.clientX - rect.current.x) / rect.current?.width) * numSegments,
            0,
            numSegments
          )
        );
        if (strummedSegment != lastStrummedSegment) {
          setLastStrummedSegment(strummedSegment);
          onSegmentStrum(strummedSegment);
        }
      }
    },
    [lastStrummedSegment, numSegments, onSegmentStrum]
  );

  return (
    <div
      ref={strumplateDiv}
      className="strumplate"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
    >
      {Array.from({ length: numSegments }).map((_, i) => (
        <div
          key={i}
          data-i={i}
          className={lastStrummedSegment === i ? "strummed" : undefined}
        />
      ))}
    </div>
  );
}
