import { Box, TextField, TextFieldProps, useTheme } from "@mui/material";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [inputStyle, setInputStyle] = useState<{
    paddingTop: string;
    paddingBottom: string;
    paddingLeft: string;
    paddingRight: string;
    fontSize: string;
    lineHeight: string;
  } | null>(null);

  const [styleClass, setStyleClass] = useState<string>("");
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    setStyleClass(getRegexColorizerClass());
  }, []);

  // Apply RegexBuddy-style theme colors
  useEffect(() => {
    if (!styleClass) return;

    const isDark = theme.palette.mode === "dark";
    const styleId = `regex-buddy-theme-${styleClass}`;

    const existingOverride = document.getElementById(styleId);
    if (existingOverride) existingOverride.remove();

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = isDark
      ? `
        .${styleClass}, .${styleClass} * { border-radius: 0 !important;
        white-space: pre !important;
        word-break: normal !important;
        overflow-wrap: normal !important; }
        .${styleClass} { color: #e0e0e0; font-family: Consolas, "Source Code Pro", Monospace; }
        .${styleClass} b { font-weight: normal; }
        .${styleClass} i { font-style: normal; }
        .${styleClass} u { text-decoration: none; }
        .${styleClass} b { background: #4a90e2; color: #e0f0ff; }
        .${styleClass} b.err { background: #ff4444; color: #fff; }
        .${styleClass} i { background: #d9774a; color: #fff; }
        .${styleClass} i b { background: #c06432; color: #fff; }
        .${styleClass} b.g1 { background: #2ea043; color: #fff; }
        .${styleClass} b.g2 { background: #e3b341; color: #1a1a1a; }
        .${styleClass} b.g3 { background: #22863a; color: #fff; }
        .${styleClass} b.g4 { background: #c4840a; color: #fff; }
        .${styleClass} b.g5 { background: #4caf50; color: #000; }
        .${styleClass} span { background: #707070; color: #f0f0f0; }
        .${styleClass} i span { background: #a0a0a0; color: #f0f0f0; }
      `
      : `
        .${styleClass}, .${styleClass} * { border-radius: 0 !important;
        white-space: pre !important;
        word-break: normal !important;
        overflow-wrap: normal !important; }
        .${styleClass} { color: #000; font-family: Consolas, "Source Code Pro", Monospace; }
        .${styleClass} b { font-weight: normal; }
        .${styleClass} i { font-style: normal; }
        .${styleClass} u { text-decoration: none; }
        .${styleClass} b { background: #80c0ff; color: #000080; }
        .${styleClass} b.err { background: #ff0000; color: #fff; }
        .${styleClass} i { background: #ffc080; color: #603000; }
        .${styleClass} i b { background: #e0a060; color: #302000; }
        .${styleClass} b.g1 { background: #00c000; color: #fff; }
        .${styleClass} b.g2 { background: #c0c000; color: #000; }
        .${styleClass} b.g3 { background: #008000; color: #fff; }
        .${styleClass} b.g4 { background: #808000; color: #fff; }
        .${styleClass} b.g5 { background: #0f0; color: #000; }
      `;
    document.head.appendChild(style);

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [styleClass, theme.palette.mode]);

  // Measure the input once it exists (and when TextField styling changes)
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const computedStyle = window.getComputedStyle(input);
    setInputStyle({
      paddingTop: computedStyle.paddingTop,
      paddingBottom: computedStyle.paddingBottom,
      paddingLeft: computedStyle.paddingLeft,
      paddingRight: computedStyle.paddingRight,
      fontSize: computedStyle.fontSize,
      lineHeight: computedStyle.lineHeight,
    });
  }, [props.size, props.variant, props.multiline]);

  // Keep overlay horizontally aligned with the input’s scroll position
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const sync = () => setScrollLeft(input.scrollLeft);

    // Initial sync (especially important after value changes)
    sync();

    input.addEventListener("scroll", sync, { passive: true });
    return () => input.removeEventListener("scroll", sync);
  }, [value]);

  return (
    <Box position="relative">
      {/* Highlight layer (behind input) */}
      {inputStyle && styleClass && (
        <Box
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

            // Force single line + clip
            whiteSpace: "nowrap",
            overflow: "hidden",

            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* Inner element is what we shift horizontally */}
          <Box
            className={styleClass}
            sx={{
              display: "inline-block",
              whiteSpace: "nowrap",
              transform: `translateX(${-scrollLeft}px)`,
              willChange: "transform",
            }}
            dangerouslySetInnerHTML={{ __html: colorizePattern(value) }}
          />
        </Box>
      )}

      {/* Real input (in front) */}
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange?.(e)}
        InputProps={{
          inputRef,
        }}
        inputProps={{
          style: {
            fontFamily: "Consolas, 'Source Code Pro', monospace",
            background: "transparent",
            color: "transparent",
            caretColor: theme.palette.text.primary,
            position: "relative",
            zIndex: 1,

            // Ensure the input itself is single-line + scrollable horizontally
            whiteSpace: "nowrap",
            overflowX: "auto",
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
