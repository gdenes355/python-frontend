import React, { useState, useEffect, useMemo } from 'react';
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

const absoluteRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

function enhancePath(filePath, bookPath) {
    // if filepath is a relative path, then transform it to an absolute path using bookPath
    if (absoluteRegex.test(filePath)) {
        return filePath;
    } else {
        return new URL(filePath, bookPath);
    }
}

export default function Book() {

    const [data, setData] = useState(null);
    const [paths, setPaths] = useState({guidePath: null, pyPath: null});
    const [tests, setTests] = useState(null)
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [allTestResults, setAllTestResults] = useState({passed: new Set(), failed: new Set()})

    const searchParams = new URLSearchParams(useLocation().search);
    const bookPath = searchParams.get('book')
    const bookPathAbsolute = useMemo(() => absoluteRegex.test(bookPath) ? bookPath : new URL(bookPath, document.baseURI), [bookPath]);
    const bookChallengeId = searchParams.get('chid');

    const activeTestsPassingChanged = (newTestState) => {
        if (newTestState === true) {
            allTestResults.passed.add(bookChallengeId);
            allTestResults.failed.delete(bookChallengeId);
        } else if (newTestState === false) {
            allTestResults.passed.delete(bookChallengeId);
            allTestResults.failed.add(bookChallengeId);        
        } else {
            allTestResults.passed.delete(bookChallengeId);
            allTestResults.failed.delete(bookChallengeId);            
        }
        setAllTestResults(allTestResults); // trigger update
        storeAllResults()
    }

    const storeAllResults = () => {
        localStorage.setItem(encodeURIComponent(bookPath + "-testsPassing"), JSON.stringify([...allTestResults.passed]))
        localStorage.setItem(encodeURIComponent(bookPath + "-testsFailing"), JSON.stringify([...allTestResults.failed]))
    }

    useEffect(() => {
        fetch(bookPath)
            .then((response) => response.json())
            .then((bookData) => setData(bookData));
        let cachedPass = JSON.parse(localStorage.getItem(encodeURIComponent(bookPath + "-testsPassing")))
        let cachedFail = JSON.parse(localStorage.getItem(encodeURIComponent(bookPath + "-testsFailing")))
        if (cachedPass && cachedPass) {
            setAllTestResults({passed: new Set(cachedPass), failed: new Set(cachedFail)})
        }
    }, [bookPath]);

    useEffect(() => {
        if (data) {
            if (bookChallengeId) {
                let node = findNode(data, bookChallengeId);
                if (node) {
                    setPaths({guidePath: enhancePath(node.guide, bookPathAbsolute), 
                        pyPath: enhancePath(node.py, bookPathAbsolute)})
                    setTests(node.tests)
                }
            } else {
                setPaths({guidePath: null, pyPath: null})
            }
        }
    }, [data, bookChallengeId, bookPathAbsolute])

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
                        uid={bookPath + bookChallengeId}
                        onTestsPassingChanged={activeTestsPassingChanged}>
                    </Challenge>
                    <BookDrawer data={data} allTestResults={allTestResults} activePage={bookChallengeId} onToggle={toggleDrawer} open={drawerOpen}></BookDrawer>
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment> 
                    <BookCover data={data}></BookCover>
                </React.Fragment>
            )
        }
    } else {
        return (
            <p>Loading book...</p>
        )
    }
}
