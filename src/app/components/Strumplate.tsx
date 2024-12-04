"use client";

export default function Strumplate({
  onSegmentStrum,
}: {
  onSegmentStrum: (i: number) => void;
}) {
  const numSegments = 3 * 4 + 1;



  return (
    <div className="strumplate">
      {Array.from({ length: numSegments }).map((_, i) => (
        <div
          key={i}
          onMouseOver={() => onSegmentStrum(i)}
          onTouchMove={() => onSegmentStrum(i)}
        />
      ))}
    </div>
  );
}
