"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import classNames from "classnames";
import * as Tone from "tone";
import { Chord, ChordType } from "tonal";
import Strumplate from "./Strumplate";

const ORGAN_OCTAVE = 3;
const STRUM_OCTAVE = 4;

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

const keyboard3 = [
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
  /**/
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
  /**/
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
];

const keyCodeToNote = (code: string) => {
  if (code) {
    return {
      note: notes[keyboard3.indexOf(code) % 12],
    };
  }

  return {
    note: undefined,
  };
};

const pressedKeysToChordType = (pressedKeys: Array<string>) => {
  const pressedRows = pressedKeys.map((key) =>
    Math.floor(keyboard3.indexOf(key) / 12)
  );
  if (pressedRows.length == 1) {
    if (pressedRows[0] === 0) {
      return "major";
    }
    if (pressedRows[0] === 1) {
      return "minor";
    }
    if (pressedRows[0] === 2) {
      return "dominant seventh";
    }
  }
  if (pressedRows.length === 2) {
    if (pressedRows.includes(0) && pressedRows.includes(2)) {
      return "major seventh";
    }
    if (pressedRows.includes(1) && pressedRows.includes(2)) {
      return "minor seventh";
    }
    if (pressedRows.includes(0) && pressedRows.includes(1)) {
      return "diminished";
    }
  }
  if (pressedRows.length === 3) {
    return "augmented";
  }
};

export default function Keyboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [started, setStarted] = useState(Tone.context.state === "running");
  const [pressedKeys, setPressedKeys] = useState<Array<string>>([]);

  const [organVolume, setOrganVolume] = useState(-20);
  const [strumVolume, setStrumVolume] = useState(0);

  const organSynthRef = useRef<Tone.PolySynth | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);

  const keydownListener = useCallback(
    (event: KeyboardEvent | { code: string }) => {
      if ("getModifierState" in event) {
        if (
          event.getModifierState("Meta") ||
          event.getModifierState("Control")
        ) {
          return;
        }
      }

      if (!pressedKeys.includes(event.code)) {
        const { note } = keyCodeToNote(event.code);
        const { note: pressedNote } = keyCodeToNote(pressedKeys[0]);
        if (!pressedNote || note === pressedNote) {
          setPressedKeys([...pressedKeys, event.code]);
        } else {
          setPressedKeys([event.code]);
        }
      } else {
        setPressedKeys(pressedKeys.filter((key) => key != event.code));
      }
    },
    [pressedKeys]
  );

  const { note } = keyCodeToNote(pressedKeys[0]);

  const chordType = pressedKeysToChordType(pressedKeys);

  useEffect(() => {
    document.addEventListener("keydown", keydownListener);

    return () => {
      document.removeEventListener("keydown", keydownListener);
    };
  }, [keydownListener]);

  useEffect(() => {
    if (started) {
      (async () => {
        await Tone.start();

        const vibrato = new Tone.Vibrato(10, 0.1).toDestination();

        const synth = new Tone.PolySynth(Tone.FMSynth, {
          envelope: {
            attack: 0.01,
            decay: 0,
            sustain: 0.3,
            release: 0.5,
          },
          volume: strumVolume,
        }).connect(vibrato);

        organSynthRef.current = new Tone.PolySynth(Tone.FMSynth, {
          envelope: {
            attack: 0.01,
            decay: 0,
            sustain: 0.3,
            release: 0.5,
          },
          volume: organVolume,
        }).toDestination();

        synthRef.current = synth;
      })();
    }
  }, [started]);

  useEffect(() => {
    organSynthRef.current?.set({
      volume: organVolume,
    });
  }, [organVolume]);

  useEffect(() => {
    synthRef.current?.set({
      volume: strumVolume,
    });
  }, [strumVolume]);

  const onStart = () => {
    setStarted(true);
  };

  useEffect(() => {
    if (organSynthRef.current) {
      organSynthRef.current.releaseAll();

      if (chordType && note) {
        const notes = Chord.notes(chordType, note);

        for (const note of notes) {
          organSynthRef.current.triggerAttack(`${note}${ORGAN_OCTAVE}`);
        }
      }
    }
  }, [chordType, note]);

  const onSegmentStrum = useCallback(
    (i: number) => {
      if (synthRef.current && chordType && note) {
        const degrees = Chord.degrees(chordType, `${note}${STRUM_OCTAVE}`);

        synthRef.current.triggerAttackRelease(degrees(i + 1), "8n");
      }
    },
    [chordType, note]
  );

  if (!isClient) {
    return null;
  }

  return (
    <>
      {!started ? (
        <button className="start" onClick={onStart}>
          start
        </button>
      ) : (
        <>
          <div className="synth">
            <div className="keyboard-container">
              <div className="keyboard2">
                <div className="body">
                  {keyboard2.map((column, i) => (
                    <div className="column" key={i}>
                      <div className="heading">
                        <div>{notes[i]}</div>
                      </div>
                      {column.map((key) => {
                        const isPressed = pressedKeys.includes(key);

                        return (
                          <div
                            key={key}
                            className={classNames("key", {
                              "is-pressed": isPressed,
                            })}
                            onPointerDown={() => keydownListener({ code: key })}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="strumplate-container">
              <Strumplate onSegmentStrum={onSegmentStrum}></Strumplate>
            </div>
          </div>

          <div className="controls">
            <div>
              <label>
                organ vol
                <input
                  type="range"
                  value={organVolume}
                  min={-50}
                  max={0}
                  step={0.1}
                  onChange={(e) => setOrganVolume(e.target.valueAsNumber)}
                />
              </label>
            </div>
            <div>
              <label>
                strum vol
                <input
                  type="range"
                  min={-50}
                  max={0}
                  step={0.1}
                  onChange={(e) => setStrumVolume(e.target.valueAsNumber)}
                  value={strumVolume}
                ></input>
              </label>
            </div>
          </div>
        </>
      )}
    </>
  );
}
