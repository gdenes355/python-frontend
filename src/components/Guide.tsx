import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { styled } from "@mui/material/styles";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";

type GuideProps = {
  md: string;
  theme?: string;
};

const StyledGuide = styled("div")(
  ({ theme }) => `
    line-height: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
    margin-top: 3px;
    padding-bottom: 50px;
    & :not(pre div) > code { background-color: ${theme.palette.secondary.light};  border-radius: 5px; padding: 4px; };
    & pre { background-color: ${theme.palette.secondary.light}; }

`
);

const Guide = ({ md, theme }: GuideProps) => {
  const [localMd, setLocalMd] = useState("");
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
  return (
    <StyledGuide>
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                children={String(children).replace(/\n$/, "")}
                style={theme === "vs-dark" ? vscDarkPlus : vs}
                customStyle={{ fontSize: "1.05em" }}
                language={match[1]}
                PreTag="div"
                {...props}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {localMd}
      </ReactMarkdown>
    </StyledGuide>
  );
};

export default Guide;
