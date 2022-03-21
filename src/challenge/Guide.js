import * as React from 'react'
import {Box, Button} from '@mui/material';
import ReactMarkdown from 'react-markdown'
import { styled } from '@mui/material/styles';


const StyledGuide = styled('div')(({theme}) => `
    line-height: 1.5rem;
    & :not(pre) > code { background-color: ${theme.palette.secondary.light}; color: ${theme.palette.error.main}; border-radius: 5px; padding: 2px; }
    & pre { background-color: ${theme.palette.secondary.light}; border-radius: 5px; padding: 10px;}
`)
  
export default function Guide({md}) {
    return <StyledGuide><ReactMarkdown>{md}</ReactMarkdown></StyledGuide>;
}
