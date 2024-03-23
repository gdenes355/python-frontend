import React, { useCallback, useImperativeHandle } from "react";

type AudioPlayerProps = {};

type AudioPlayerHandle = {
  runAudioCommand: (msg: string) => void;
};

const AudioPlayer = React.forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  (props, ref) => {
    const runAudioCommand = useCallback((msg: string) => {
      const audio: HTMLAudioElement = document.getElementById(
        "audio"
      ) as HTMLAudioElement;

      const audioSource: HTMLSourceElement = document.getElementById(
        "audioSource"
      ) as HTMLSourceElement;

      const audioObj = JSON.parse(msg);

      if (audioObj.action === "load") {
        audioSource.src = audioObj.source;
        audio.load();
      } else if (audioObj.action === "play") {
        audio.play();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      runAudioCommand,
    }));

    return (
      <audio style={{ display: "none" }} id="audio" crossOrigin="anonymous">
        <source id="audioSource" src=""></source>
        Your browser does not support the audio element.
      </audio>
    );
  }
);

export default AudioPlayer;
export type { AudioPlayerHandle };
