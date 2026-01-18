import { Box, TextField, TextFieldProps, useTheme } from "@mui/material";
import { useRef, useEffect, useState } from "react";
import { colorizePattern, loadStyles } from "regex-colorizer";

loadStyles();

// Get the regex-colorizer style ID from the loaded stylesheet
function getRegexColorizerClass(): string {
  const styleEl = document.querySelector('style[id^="rc-"]');
  return styleEl?.id || "";
}

export function RegexInput({
  value,
  onChange,
  ...props
}: { value: string } & TextFieldProps) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [inputStyle, setInputStyle] = useState<{
    paddingTop: string;
    paddingBottom: string;
    paddingLeft: string;
    paddingRight: string;
    fontSize: string;
    lineHeight: string;
  } | null>(null);
  const [styleClass, setStyleClass] = useState<string>("");

  useEffect(() => {
    setStyleClass(getRegexColorizerClass());
  }, []);

  // Apply RegexBuddy-style theme colors
  useEffect(() => {
    if (!styleClass) return;

    const isDark = theme.palette.mode === "dark";
    const styleId = `regex-buddy-theme-${styleClass}`;

    // Remove existing override if any
    const existingOverride = document.getElementById(styleId);
    if (existingOverride) {
      existingOverride.remove();
    }

    // Create theme-specific styles
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = isDark
      ? `
        /*  Dark Theme */
        .${styleClass}, .${styleClass} * { border-radius: 0 !important; }
        .${styleClass} { color: #e0e0e0; font-family: Consolas, "Source Code Pro", Monospace; white-space: pre-wrap; word-break: break-all; overflow-wrap: anywhere; }
        .${styleClass} b { font-weight: normal; }
        .${styleClass} i { font-style: normal; }
        .${styleClass} u { text-decoration: none; }
        /* metasequence */
        .${styleClass} b { background: #4a90e2; color: #e0f0ff; }
        /* error */
        .${styleClass} b.err { background: #ff4444; color: #fff; }
        /* char class */
        .${styleClass} i { background: #d9774a; color: #fff; }
        /* char class: metasequence */
        .${styleClass} i b { background: #c06432; color: #fff; }
        /* group: depth */
        .${styleClass} b.g1 { background: #2ea043; color: #fff; }
        .${styleClass} b.g2 { background: #e3b341; color: #1a1a1a; }
        .${styleClass} b.g3 { background: #22863a; color: #fff; }
        .${styleClass} b.g4 { background: #c4840a; color: #fff; }
        .${styleClass} b.g5 { background: #4caf50; color: #000; }
        .${styleClass} span { background: #707070; color: #f0f0f0; }
        .${styleClass} i span { background: #a0a0a0; color: #f0f0f0; }
      `
      : `
        /*  Light Theme */
        .${styleClass}, .${styleClass} * { border-radius: 0 !important; }
        .${styleClass} { color: #000; font-family: Consolas, "Source Code Pro", Monospace; white-space: pre-wrap; word-break: break-all; overflow-wrap: anywhere; }
        .${styleClass} b { font-weight: normal; }
        .${styleClass} i { font-style: normal; }
        .${styleClass} u { text-decoration: none; }
        /* metasequence */
        .${styleClass} b { background: #80c0ff; color: #000080; }
        /* error */
        .${styleClass} b.err { background: #ff0000; color: #fff; }
        /* char class */
        .${styleClass} i { background: #ffc080; color: #603000; }
        /* char class: metasequence */
        .${styleClass} i b { background: #e0a060; color: #302000; }
        /* group: depth */
        .${styleClass} b.g1 { background: #00c000; color: #fff; }
        .${styleClass} b.g2 { background: #c0c000; color: #000; }
        .${styleClass} b.g3 { background: #008000; color: #fff; }
        .${styleClass} b.g4 { background: #808000; color: #fff; }
        .${styleClass} b.g5 { background: #0f0; color: #000; }
      `;
    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [styleClass, theme.palette.mode]);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      const computedStyle = window.getComputedStyle(input);
      setInputStyle({
        paddingTop: computedStyle.paddingTop,
        paddingBottom: computedStyle.paddingBottom,
        paddingLeft: computedStyle.paddingLeft,
        paddingRight: computedStyle.paddingRight,
        fontSize: computedStyle.fontSize,
        lineHeight: computedStyle.lineHeight,
      });
    }
  }, [value]);

  return (
    <Box position="relative">
      {/* Highlight layer - positioned behind input */}
      {inputStyle && styleClass && (
        <Box
          ref={overlayRef}
          className={styleClass}
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            paddingTop: inputStyle.paddingTop,
            paddingBottom: inputStyle.paddingBottom,
            paddingLeft: inputStyle.paddingLeft,
            paddingRight: inputStyle.paddingRight,
            fontSize: inputStyle.fontSize,
            lineHeight: inputStyle.lineHeight,
            whiteSpace: "pre",
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 0,
          }}
          dangerouslySetInnerHTML={{
            __html: colorizePattern(value),
          }}
        />
      )}
      {/* Real input - positioned in front */}
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange?.(e)}
        InputProps={{
          inputRef: inputRef,
        }}
        inputProps={{
          style: {
            fontFamily: "monospace",
            background: "transparent",
            color: "transparent",
            caretColor: theme.palette.text.primary,
            position: "relative",
            zIndex: 1,
          },
        }}
        sx={{
          position: "relative",
          zIndex: 1,
        }}
        {...props}
      />
    </Box>
  );
}
