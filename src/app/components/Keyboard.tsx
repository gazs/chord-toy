"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import classNames from "classnames";
import * as Tone from "tone";
import { Chord } from "tonal";

const keyboard = [
  [
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Digit0",
    "Minus",
    "Equal",
  ],
  [
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyO",
    "KeyU",
    "KeyI",
    "KeyP",
    "BracketLeft",
    "BracketRight",
  ],
  [
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
    "Backslash",
  ],
];

const rows = ["major", "minor", "major seventh"];
const notes = ["Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#"];

const keyCodeToNote = (code: string) => {
  for (const row in keyboard) {
    const index = keyboard[row].findIndex((keycode) => code === keycode);
    if (index > -1) {
      return { note: notes[index], chordType: rows[row] };
    }
  }
};

export default function Keyboard() {
  const [started, setStarted] = useState(false);
  const [pressedKeys, setPressedKeys] = useState(new Set());

  const synthRef = useRef<Tone.PolySynth | null>(null);

  const keydownListener = useCallback(
    (event) => {
      for (const row in keyboard) {
        if (keyboard[row].includes(event.code)) {
        }
      }

      const pressedKey = event.code;

      const { chordType, note } = keyCodeToNote(pressedKey);

      const notes = Chord.notes(chordType, note);

      for (const note of notes) {
        synthRef.current?.triggerAttack(`${note}4`);
      }

      const newKeys = new Set(pressedKeys);
      newKeys.add(pressedKey);
      setPressedKeys(newKeys);
    },
    [pressedKeys]
  );

  const keyupListener = useCallback(
    (event) => {
      const liftedKey = event.code;

      const newKeys = new Set(pressedKeys);

      const { chordType, note } = keyCodeToNote(liftedKey);

      const notes = Chord.notes(chordType, note);

      for (const note of notes) {
        synthRef.current?.triggerRelease(`${note}4`);
      }

      newKeys.delete(liftedKey);
      setPressedKeys(newKeys);
    },
    [pressedKeys]
  );

  useEffect(() => {
    document.addEventListener("keydown", keydownListener);
    document.addEventListener("keyup", keyupListener);

    return () => {
      document.removeEventListener("keydown", keydownListener);
      document.removeEventListener("keyup", keyupListener);
    };
  }, [keydownListener, keyupListener, pressedKeys]);

  useEffect(() => {
    if (started) {
      (async () => {
        await Tone.start();

        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            partials: [0, 2, 3, 4],
          },
        }).toDestination();

        synth.triggerAttackRelease("C4", "8n");
        synthRef.current = synth;
      })();
    }
  }, [started]);

  const onStart = () => {
    setStarted(true);
  };

  return (
    <div>
      <button onClick={onStart} className="start">
        start
      </button>

      <div className="keyboard">
        {keyboard.map((keyboardRow, rowIndex) => (
          <div key={rowIndex} className="row">
            <div>{rows[rowIndex]}</div>
            {keyboardRow.map((key, noteIndex) => {
              const myCode = keyboard[rowIndex][noteIndex];
              const isPressed = pressedKeys.has(myCode);
              return (
                <div
                  key={key}
                  className={classNames("note", { "is-pressed": isPressed })}
                  onTouchStart={() => keydownListener({ code: myCode })}
                  onTouchEnd={() => keyupListener({ code: myCode })}
                  onMouseDown={() => keydownListener({ code: myCode })}
                  onMouseUp={() => keyupListener({ code: myCode })}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
