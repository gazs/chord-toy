"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import classNames from "classnames";
import * as Tone from "tone";
import { Chord } from "tonal";
import Strumplate from "./Strumplate";

const ORGAN_OCTAVE = 3;
const STRUM_OCTAVE = 4;

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

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [started, setStarted] = useState(Tone.context.state === "running");
  const [pressedKey, setPressedKey] = useState<string | undefined>();

  const [organVolume, setOrganVolume] = useState(-20);
  const [strumVolume, setStrumVolume] = useState(0);

  const organSynthRef = useRef<Tone.PolySynth | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);

  const keydownListener = useCallback((event: { code: string }) => {
    if (!pressedKey) {
      setPressedKey(event.code);
    }
  }, []);

  const keyupListener = useCallback((_event: { code: string }) => {
    setPressedKey(undefined);
  }, []);

  let { chordType, note } = keyCodeToNote(pressedKey);


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

        const vibrato = new Tone.Vibrato(10, 0.1).toDestination();

        const synth = new Tone.PolySynth(Tone.FMSynth, {
          envelope: {
            attack: 0.01,
            decay: 0,
            sustain: 0.3,
            release: 0.5,
          },
          volume: strumVolume
        }).connect(vibrato);

        organSynthRef.current = new Tone.PolySynth(Tone.FMSynth, {
          envelope: {
            attack: 0.01,
            decay: 0,
            sustain: 0.3,
            release: 0.5,
          },
          volume: organVolume
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
  }, [chordType, note, pressedKey]);


  const onSegmentStrum = useCallback(
    (i: number) => {
      if (synthRef.current && chordType && note) {
        const degrees = Chord.degrees(chordType, `${note}${STRUM_OCTAVE}`);

        synthRef.current.triggerAttackRelease(degrees(i + 1), "8n");
      }
    },
    [`${chordType} ${note}`]
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
