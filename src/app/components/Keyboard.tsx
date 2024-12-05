"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import classNames from "classnames";
import * as Tone from "tone";
import { Chord } from "tonal";
import Strumplate from "./Strumplate";

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

const keyboard2 = [
  ["Digit1", "KeyQ", "KeyA"],
  ["Digit2", "KeyW", "KeyS"],
  ["Digit3", "KeyE", "KeyD"],
  ["Digit4", "KeyR", "KeyF"],
  ["Digit5", "KeyT", "KeyG"],
  ["Digit6", "KeyY", "KeyH"],
  ["Digit7", "KeyU", "KeyJ"],
  ["Digit8", "KeyI", "KeyK"],
  ["Digit9", "KeyO", "KeyL"],
  ["Digit0", "KeyP", "Semicolon"],
  ["Minus", "BracketLeft", "Quote"],
  ["Equal", "BracketRight", "Backslash"],
];

const keyCodeToNote = (code?: string) => {
  for (const row in keyboard) {
    const index = keyboard[row].findIndex((keycode) => code === keycode);
    if (index > -1) {
      return { note: notes[index], chordType: rows[row] };
    }
  }

  return {
    note: undefined,
    chordType: undefined,
  };
};

export default function Keyboard() {
  const [started, setStarted] = useState(false);
  const [pressedKey, setPressedKey] = useState();

  const synthRef = useRef<Tone.PolySynth | null>(null);

  const keydownListener = useCallback((event) => {
    setPressedKey(event.code);
  }, []);

  const keyupListener = useCallback((event) => {
    setPressedKey(undefined);
  }, []);

  const { chordType, note } = keyCodeToNote(pressedKey);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll();

      if (chordType && note) {
        const notes = Chord.notes(chordType, note);

        for (const note of notes) {
          //   synthRef.current.triggerAttack(`${note}4`);
        }
      }
    }
  }, [chordType, note, pressedKey]);

  useEffect(() => {
    document.addEventListener("keydown", keydownListener);
    document.addEventListener("keyup", keyupListener);

    return () => {
      document.removeEventListener("keydown", keydownListener);
      document.removeEventListener("keyup", keyupListener);
    };
  }, [keydownListener, keyupListener]);

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

  const onSegmentStrum = (i: number) => {
    if (synthRef.current && chordType && note) {
      const degrees = Chord.degrees(chordType, `${note}4`);

      synthRef.current.triggerAttackRelease(degrees(i + 1), "16n");
    }
  };

  return (
    <div className="synth">
      {!started && (
        <button onClick={onStart} className="start">
          start
        </button>
      )}

      <div className="keyboard2">
        <div className="heading">
          {notes.map((note) => (
            <div key={note}>{note}</div>
          ))}
        </div>
        <div className="body">
          {keyboard2.map((column, i) => (
            <div className="column" key={i}>
              {column.map((key) => {
                const isPressed = pressedKey == key;

                return (
                  <div
                    className={classNames("key", { "is-pressed": isPressed })}
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
      <Strumplate onSegmentStrum={onSegmentStrum}></Strumplate>
    </div>
  );
}
