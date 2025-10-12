import { useEffect, useState, useContext, useMemo } from "react";
import Markdown, { defaultUrlTransform } from "react-markdown";
import { Box, Table, TableContainer, TableHead, TableRow } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import VsThemeContext from "../themes/VsThemeContext";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import TurtlePreview from "../challenge/components/Guide/TurtlePreview";
import remarkGfm from "remark-gfm";

// register languages which are needed for syntax highlighting
import py from "react-syntax-highlighter/dist/esm/languages/prism/python";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";

SyntaxHighlighter.registerLanguage("python", py);
SyntaxHighlighter.registerLanguage("json", json);

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

const hasMath = (s: string) => /\$(?:[^$]|\\\$)+\$|$$[\s\S]+?$$/.test(s);

const Guide = ({ md, turtleExampleImage, challengeId }: GuideProps) => {
  const [localMd, setLocalMd] = useState("");
  const themeContext = useContext(VsThemeContext);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rehypeKatex, setRehypeKatex] = useState<any>(null);

  useEffect(() => {
    // For best visuals, the md cannot have ``` tags without a language definition
    // the code below will ensure that opening ``` tags have a plaintext annotation
    const parts = md.split("```");
    for (let i = 1; i < parts.length; i += 2) {
      if (/^[\r\n].*/.test(parts[i])) {
        parts[i] = "plaintext" + parts[i];
      }
    }
    setLocalMd(parts.join("```"));
    if (hasMath(md)) {
      // dynamic import keeps KaTeX out of the main bundle
      import("rehype-katex").then((mod) => setRehypeKatex(() => mod.default));
    } else {
      setRehypeKatex(null);
    }
  }, [md]);

  const rehypePlugins = useMemo(
    () => (rehypeKatex ? [rehypeKatex] : []),
    [rehypeKatex]
  );

  const rendered = useMemo(() => {
    return (
      <StyledGuide>
        <Box>
          {/* mask out the guide toggle fab, so we don't have text running behind it */}
          <Box
            id="guide-toggle-mask"
            aria-hidden
            sx={{
              float: "right",
              position: "sticky",
              top: 0,
              width: 40,
              height: 40,
              mr: "6px",
              pointerEvents: "none",
            }}
          />
          <Markdown
            urlTransform={(url) => {
              if (url.startsWith("data:image/")) {
                return url;
              }
              return defaultUrlTransform(url);
            }}
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, "")}
                    customStyle={{ fontSize: "1.05em" }}
                    language={match[1]}
                    PreTag="div"
                    style={themeContext.theme === "vs-dark" ? vscDarkPlus : vs}
                  />
                ) : (
                  <code className={className}>{children}</code>
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
              a({ href, children, ...props }) {
                return (
                  <a target="_blank" rel="noreferrer" href={href} {...props}>
                    {children}
                  </a>
                );
              },
              table({ children }) {
                return (
                  <TableContainer>
                    <Table size="small">{children}</Table>
                  </TableContainer>
                );
              },
              thead({ children }) {
                return <TableHead>{children}</TableHead>;
              },
              tr({ children }) {
                return <TableRow hover>{children}</TableRow>;
              },
              td({ node, children, style, ...props }) {
                return (
                  <td style={{ border: "1px solid", ...style }} {...props}>
                    {children}
                  </td>
                );
              },
            }}
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={rehypePlugins}
          >
            {localMd}
          </Markdown>
        </Box>
      </StyledGuide>
    );
  }, [
    localMd,
    turtleExampleImage,
    challengeId,
    themeContext.theme,
    rehypePlugins,
  ]);

  return rendered;
};

export default Guide;
