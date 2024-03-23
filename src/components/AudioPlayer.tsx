import React, { useCallback, useImperativeHandle, useRef } from "react";

type AudioPlayerProps = {};

type AudioPlayerHandle = {
  runAudioCommand: (msg: string) => void;
};

const AudioPlayer = React.forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  (props, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioSourceRef = useRef<HTMLSourceElement>(null);

    const runAudioCommand = useCallback((msg: string) => {
      const audioObj = JSON.parse(msg);

      if (audioObj.action === "load" && audioSourceRef.current) {
        audioSourceRef.current.src = audioObj.source;
        audioRef.current?.load();
      } else if (audioObj.action === "play") {
        audioRef.current?.play();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      runAudioCommand,
    }));

    return (
      <audio
        style={{ display: "none" }}
        id="audio"
        crossOrigin="anonymous"
        ref={audioRef}
      >
        <source id="audioSource" src="" ref={audioSourceRef}></source>
        Your browser does not support the audio element.
      </audio>
    );
  }
);

export default AudioPlayer;
export type { AudioPlayerHandle };
