import React, { useEffect, useState, useContext, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import VsThemeContext from "../themes/VsThemeContext";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import TurtlePreview from "./TurtlePreview";

type GuideProps = {
  md: string;
  challengeId?: string;
  turtleExampleImage?: string;
};

const StyledGuide = styled("div")(
  ({ theme }) => `
    line-height: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
    margin-top: 3px;
    padding-bottom: 50px;
    & :not(pre div) > code { background-color: ${theme.palette.secondary.light};  border-radius: 5px; padding: 4px; color: black; };
    & pre { background-color: ${theme.palette.secondary.light}; color: black;}
    & img { border: 1px solid ${theme.palette.secondary.light}; }
`
);

const Guide = ({ md, turtleExampleImage, challengeId }: GuideProps) => {
  const [localMd, setLocalMd] = useState("");
  const themeContext = useContext(VsThemeContext);
  useEffect(() => {
    // For best visuals, the md cannot have ``` tags without a language definition
    // the code below will ensure that opening ``` tags have a plaintext annotation
    let parts = md.split("```");
    for (let i = 1; i < parts.length; i += 2) {
      if (/^[\r\n].*/.test(parts[i])) {
        parts[i] = "plaintext" + parts[i];
      }
    }
    setLocalMd(parts.join("```"));
  }, [md]);

  const rendered = useMemo(() => {
    return (
      <StyledGuide>
        <Box>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, "")}
                    customStyle={{ fontSize: "1.05em" }}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                    style={themeContext.theme === "vs-dark" ? vscDarkPlus : vs}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              img({ node, className, src, alt, children, ...props }) {
                if (src === "turtlepreview") {
                  return (
                    <TurtlePreview
                      challengeId={challengeId}
                      turtleExampleImage={turtleExampleImage}
                    />
                  );
                } else {
                  return (
                    <img className={className} alt={alt} src={src} {...props}>
                      {children}
                    </img>
                  );
                }
              },
            }}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {localMd}
          </ReactMarkdown>
        </Box>
      </StyledGuide>
    );
  }, [localMd, turtleExampleImage, challengeId, themeContext.theme]);

  return rendered;
};

export default Guide;
