import React from 'react';
import {Box,Drawer}  from '@mui/material';
import BookContents from './BookContents'

import BookNodeModel from '../models/BookNodeModel'
import {AllTestResults} from '../models/Tests'


type BookDrawerProps = {
    open: boolean,
    bookRoot: BookNodeModel,
    allTestResults: AllTestResults,
    activePageId?: string,
    onRequestOpen: (open: boolean) => void,
    onNodeSelected: (node: BookNodeModel) => void,
};

const BookDrawer = (props: BookDrawerProps) => {

    return (
        <Drawer anchor='right' open={props.open} onClose={() => props.onRequestOpen(false)}>
            <Box
            sx={{ width:  250 }}
            role="presentation">
                <BookContents
                    bookRoot={props.bookRoot}
                    onNodeSelected={props.onNodeSelected}
                    allTestResults={props.allTestResults}
                    activePageId={props.activePageId}
                />
            </Box>
        </Drawer>
    )
}

export default BookDrawer;
