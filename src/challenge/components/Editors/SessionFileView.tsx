import { useEffect, useMemo, useRef, useState } from "react";
import { SessionFile } from "../../../models/SessionFile";
import { Box, Fab, Tooltip } from "@mui/material";

import CodeOffIcon from "@mui/icons-material/CodeOff";
import CodeIcon from "@mui/icons-material/Code";
import DownloadIcon from "@mui/icons-material/Download";
import mime from "mime/lite";

type SessionFileViewProps = {
  file: SessionFile;
};

type SessionFileType = "image" | "text" | "audio" | "unknown";

const SessionFileView = ({ file }: SessionFileViewProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  const [showImageAsText, setShowImageAsText] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const onWheel = (event: WheelEvent) => {
    if (event && event.ctrlKey) {
      if (event.deltaY > 0) {
        setZoom((prev) => Math.max(0.1, prev - 0.1));
      } else {
        setZoom((prev) => Math.min(2, prev + 0.1));
      }
      event.preventDefault();
    }
  };

  const setImageContainerRef = (el: HTMLDivElement) => {
    if (imageContainerRef.current) {
      imageContainerRef.current.removeEventListener("wheel", onWheel);
    }
    if (el) el.addEventListener("wheel", onWheel, { passive: false });
    imageContainerRef.current = el;
  };

  useEffect(() => {
    setShowImageAsText(false);
  }, [file.filename]);

  const imageDataAsText = useMemo(() => {
    if (!showImageAsText) return null;

    if (file.data instanceof ArrayBuffer) {
      return new TextDecoder().decode(file.data as ArrayBuffer);
    } else if (file.data instanceof Uint8Array) {
      return new TextDecoder().decode(file.data as Uint8Array);
    }
    return file.data as string;
  }, [file.data as ArrayBuffer, showImageAsText]);

  const mimeType = useMemo(() => {
    return (
      file.mimeType ||
      (file.isText ? "text/plain" : mime.getType(file.filename) || undefined)
    );
  }, [file.mimeType, file.isText, file.filename]);

  const fileType: SessionFileType = useMemo(() => {
    if (file.isText || mimeType?.startsWith("text/")) return "text";
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("audio/")) return "audio";
    return "unknown";
  }, [file.isText, mimeType]);

  if (fileType === "image") {
    return (
      <Box style={{ width: "100%", height: "100%", position: "relative" }}>
        <Box
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Tooltip
            title={
              showImageAsText ? "Display image" : "Show file contents as text"
            }
            placement="top"
          >
            <Fab
              size="small"
              onClick={() => setShowImageAsText(!showImageAsText)}
            >
              {showImageAsText ? <CodeOffIcon /> : <CodeIcon />}
            </Fab>
          </Tooltip>
          <Tooltip title="Download file" placement="top">
            <Fab
              size="small"
              onClick={() => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(
                  new Blob([file.data as ArrayBuffer])
                );
                link.download = file.filename;
                link.click();
              }}
            >
              <DownloadIcon />
            </Fab>
          </Tooltip>
        </Box>
        {showImageAsText ? (
          <Box
            style={{
              width: "100%",
              height: "100%",
              wordWrap: "break-word",
              overflowY: "auto",
            }}
          >
            {imageDataAsText}
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            ref={setImageContainerRef}
          >
            <img
              style={{ transform: `scale(${zoom * zoom})` }}
              src={URL.createObjectURL(new Blob([file.data as ArrayBuffer]))}
              alt={file.filename}
            />
            {zoom < 0.99 || zoom > 1.01 ? (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "rgba(0.5, 0.5, 0.5, 0.2)",
                  padding: "5px",
                  borderTopLeftRadius: "5px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "white",
                  textAlign: "center",
                  textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
                }}
              >
                {(zoom * zoom * 100).toFixed(0)}%
              </Box>
            ) : null}
          </Box>
        )}
      </Box>
    );
  }

  if (fileType === "text") {
    return (
      <textarea
        ref={textAreaRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          resize: "none",
          padding: "5px",
          borderWidth: "0px",
          outline: "none",
        }}
        onChange={(e) => {
          file.data = e.target.value;
        }}
        defaultValue={
          file.data instanceof ArrayBuffer || file.data instanceof Uint8Array
            ? new TextDecoder().decode(file.data as ArrayBuffer)
            : (file.data as string)
        }
      />
    );
  }

  if (fileType === "audio") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <audio
          id="audio"
          crossOrigin="anonymous"
          ref={audioElementRef}
          controls
        >
          <source
            id="audioSource"
            src={URL.createObjectURL(new Blob([file.data as ArrayBuffer]))}
          ></source>
          Your browser does not support the audio element.
        </audio>
      </Box>
    );
  }

  // ???
  return (
    <p>
      Unknown file format with {(file.data as ArrayBuffer).byteLength} bytes
    </p>
  );
};

export default SessionFileView;
