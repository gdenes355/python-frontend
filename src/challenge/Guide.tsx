import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import { styled } from '@mui/material/styles';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {vs} from 'react-syntax-highlighter/dist/esm/styles/prism'


type GuideProps = {
  md: string
};

const StyledGuide = styled('div')(({theme}) => `
    line-height: 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
    margin-top: 3px;
    & :not(pre div) > code { background-color: ${theme.palette.secondary.light}; color: ${theme.palette.error.main}; border-radius: 5px; padding: 2px; }
`);


const Guide = ({md}: GuideProps) => {
  return <StyledGuide><ReactMarkdown components={{
      code({node, inline, className, children, ...props}) {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
          <SyntaxHighlighter
            children={String(children).replace(/\n$/, '')}
            style={vs}
            customStyle = {{fontSize: "1.05em"}}
            language={match[1]}
            PreTag="div"
            {...props}
          />
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }
    }}>{md}</ReactMarkdown></StyledGuide>;
};
  
export default Guide