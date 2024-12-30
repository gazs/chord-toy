"use client";

import { useCallback, useEffect, useRef } from "react";
import clamp from "lodash/clamp";
import { throttle } from "lodash";

export default function Strumplate({
  onSegmentStrum,
}: {
  onSegmentStrum: (i: number) => void;
}) {
  const numSegments = 3 * 4 + 1;

  const rect = useRef<DOMRect>();
  const strumplateDiv = useRef<HTMLDivElement>();

  useEffect(() => {
    if (strumplateDiv.current) {
      rect.current = strumplateDiv.current.getBoundingClientRect();
    }
  }, [strumplateDiv]);

  const onMouseMove = throttle((e: React.TouchEvent) => {
    e.preventDefault();
    
    for (let i = 0; i< e.changedTouches.length; i++) {
        const touch = e.changedTouches.item(i);

        onSegmentStrum(
          Math.round(clamp(
            ((touch.clientY - rect.current.y) / rect.current?.height) * numSegments,
            0,
            numSegments
          )
        ));
    }

  }, 20);

  return (
    <div
      ref={strumplateDiv}
      className="strumplate"
    //   onMouseMoveCapture={onMouseMove}
      onTouchMoveCapture={onMouseMove}
    >
      {Array.from({ length: numSegments }).map((_, i) => (
        <div key={i} data-i={i} />
      ))}
    </div>
  );
}
