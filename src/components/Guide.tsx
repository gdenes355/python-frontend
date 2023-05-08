import React, { useEffect, useState, useContext } from "react";
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
import IChallenge from "../challenge/IChallenge";

type TurtleResultProps = {
  challenge: IChallenge;
  file: string;
};

const TurtleResult = (props: TurtleResultProps) => {
  const canvMain = props.challenge.canvasDisplayRef.current?.getCanvas();
  if (canvMain) {
    return <img src={canvMain.toDataURL()} alt={props.file} />;
  } else {
    return <img src={props.file} alt={props.file}></img>;
  }
};

type GuideProps = {
  md: string;
  challenge: IChallenge;
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

const Guide = (guideProps: GuideProps) => {
  const [localMd, setLocalMd] = useState("");
  const themeContext = useContext(VsThemeContext);
  useEffect(() => {
    // For best visuals, the md cannot have ``` tags without a language definition
    // the code below will ensure that opening ``` tags have a plaintext annotation
    let parts = guideProps.md.split("```");
    for (let i = 1; i < parts.length; i += 2) {
      if (/^[\r\n].*/.test(parts[i])) {
        parts[i] = "plaintext" + parts[i];
      }
    }
    setLocalMd(parts.join("```"));
  }, [guideProps.md]);

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
            img({ node, className, alt, children, ...props }) {
              if (alt?.endsWith(".py")) {
                return (
                  <TurtleResult
                    file={alt}
                    challenge={guideProps.challenge}
                  ></TurtleResult>
                );
              } else {
                return (
                  <img className={className} alt={alt} {...props}>
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
};

export default Guide;
