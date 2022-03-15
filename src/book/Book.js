import React, { useState, useEffect } from 'react';
import {useLocation} from "react-router-dom";
import Challenge from '../challenge/Challenge'
import BookCover from './BookCover'
import BookDrawer from './BookDrawer'

function findNode(node, id) {
    if (node.id === id) {
        return node;
    }
    for (let i = 0; i < node.children?.length; i++) {
        let res = findNode(node.children[i], id)
        if (res) {
            return res;
        }
    }
    return null;
}

export default function Book() {

    const [data, setData] = useState(null);
    const [paths, setPaths] = useState({guidePath: null, pyPath: null});
    const [tests, setTests] = useState(null)
    const [drawerOpen, setDrawerOpen] = React.useState(false)

    const searchParams = new URLSearchParams(useLocation().search);
    const bookPath = searchParams.get('book')
    const bookChallengeId = searchParams.get('chid');

    useEffect(() => {
        fetch(bookPath)
            .then((response) => response.json())
            .then((bookData) => setData(bookData));
    }, [bookPath]);

    useEffect(() => {
        if (data) {
            if (bookChallengeId) {
                let node = findNode(data, bookChallengeId);
                if (node) {
                    setPaths({guidePath: node.guide, pyPath: node.py})
                    setTests(node.tests)
                }
            } else {
                setPaths({guidePath: null, pyPath: null})
            }
        }
    }, [data, bookChallengeId])

    const toggleDrawer = (open) => {
        setDrawerOpen(open)
    };

    if (data) {
        if (paths.guidePath) {
            return (
                <React.Fragment>
                    <Challenge 
                        guidePath={paths.guidePath} 
                        codePath={paths.pyPath}
                        tests={tests && tests.length > 0 ? tests : null}
                        hasBook={true}
                        toggleBookDrawer={toggleDrawer}
                        layout="fullscreen"
                        uid={bookPath + bookChallengeId}>
                    </Challenge>
                    <BookDrawer data={data} onToggle={toggleDrawer} open={drawerOpen}></BookDrawer>
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment> 
                    <BookCover data={data}></BookCover>
                    <BookDrawer data={data} onToggle={toggleDrawer} open={drawerOpen}></BookDrawer>
                </React.Fragment>
            )
        }
    } else {
        return (
            <p>Loading book...</p>
        )
    }
}
