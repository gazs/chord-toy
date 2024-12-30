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
  const [organ, setOrgan] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | undefined>();

  const synthRef = useRef<Tone.PolySynth | null>(null);

  const keydownListener = useCallback((event: { code: string }) => {
    setPressedKey(event.code);
  }, []);

  const keyupListener = useCallback((_event: { code: string }) => {
    setPressedKey(undefined);
  }, []);

  let { chordType, note } = keyCodeToNote(pressedKey);


  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll();

      if (chordType && note && organ) {
        const notes = Chord.notes(chordType, note);

        for (const note of notes) {
          synthRef.current.triggerAttack(`${note}4`);
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

        synthRef.current = synth;
      })();
    }
  }, [started]);

  const onStart = () => {
    setStarted(true);
  };

  const onSegmentStrum = useCallback((i: number) => {
    if (synthRef.current && chordType && note) {
      const degrees = Chord.degrees(chordType, `${note}4`);

      synthRef.current.triggerAttackRelease(degrees(i + 1), "16n");
    }
  }, [ chordType, note]);

  return (
    <>
      {!started ? (
        <button className="start" onClick={onStart}>start</button>
      ) : (
        <>
          <label>
            <input
              type="checkbox"
              checked={organ}
              onChange={(e) => setOrgan(e.target.checked)}
            />
            organ
          </label>

          <div className="synth">
            <div className="keyboard2">
              <div className="body">
                {keyboard2.map((column, i) => (
                  <div className="column" key={i}>
                    <div className="heading">
                      <div>{notes[i]}</div>
                    </div>
                    {column.map((key) => {
                      const isPressed = pressedKey == key;

                      return (
                        <div
                          key={key}
                          className={classNames("key", {
                            "is-pressed": isPressed,
                          })}
                          onPointerDown={() => keydownListener({ code: key })}
                          onPointerUp={() => keyupListener({ code: key })}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <Strumplate onSegmentStrum={onSegmentStrum}></Strumplate>
          </div>
        </>
      )}
    </>
  );
}
