import React from 'react';
import { Container } from '@mui/material';

import BookContents from './BookContents';

import BookNodeModel from '../models/BookNodeModel'
import {AllTestResults} from '../models/Tests'

type BookCoverProps = {
    bookRoot: BookNodeModel,
    allTestResults: AllTestResults,
    onNodeSelected: (node: BookNodeModel) => void,
};

const BookCover = (props: BookCoverProps) => {
    return (
        <Container>
            <h1>{props.bookRoot.name}</h1>
            <BookContents
                bookRoot={props.bookRoot}
                onNodeSelected={props.onNodeSelected}
                allTestResults={props.allTestResults}
            />
        </Container>
    )
}

export default BookCover;
