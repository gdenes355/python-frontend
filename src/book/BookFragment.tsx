import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import Challenge from '../challenge/Challenge'
import BookCover from './BookCover'
import BookDrawer from './BookDrawer'

import BookNodeModel, {findBookNode, nextBookNode, prevBookNode} from '../models/BookNodeModel';
import { absolutisePath, isAbsoluteAddress } from '../utils/pathTools';
import {TestCases, AllTestResults} from '../models/Tests'

type PathsState = {
    guidePath: string | null,
    pyPath: string | null
}


const expandBookLinks = (bookNode: BookNodeModel, mainUrl: string, setRemainingBookFetches: (u: (n: number) => (number)) => void) => {
    bookNode.bookMainUrl = mainUrl;
    if (bookNode.children) {
        for (const child of bookNode.children) {
            expandBookLinks(child, mainUrl, setRemainingBookFetches)
        }
    }
    if (bookNode.bookLink) {
        setRemainingBookFetches(ct => ct + 1)
        let path = absolutisePath(bookNode.bookLink, mainUrl)
        fetch(path)
            .then((response) => response.json())
            .then((bookData) => { bookNode.children = bookData.children; expandBookLinks(bookData, path, setRemainingBookFetches); setRemainingBookFetches(ct => ct - 1)})
    }
}

export default function Book() {

    const [data, setData] = useState(null);
    const [paths, setPaths] = useState<PathsState>({guidePath: null, pyPath: null});
    const [tests, setTests] = useState<TestCases|null>(null)
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [allTestResults, setAllTestResults] = useState<AllTestResults>({passed: new Set(), failed: new Set()})

    const [remainingBookFetches, setRemainingBookFetches] = useState(1)

    const searchParams = new URLSearchParams(useLocation().search);
    const bookPath = searchParams.get('book') || ""
    const bookPathAbsolute = useMemo(() => isAbsoluteAddress(bookPath) ? new URL(bookPath) : new URL(bookPath, document.baseURI), [bookPath]);
    const bookChallengeId = searchParams.get('chid');

    const navigate = useNavigate();

    const activeTestsPassingChanged = (newTestState: boolean | null) => {
        if (!bookChallengeId) {
            return;
        }
        if (newTestState === true) {
            allTestResults.passed.add(bookChallengeId);
            allTestResults.failed.delete(bookChallengeId);
        } else if (newTestState === false) {
            allTestResults.passed.delete(bookChallengeId);
            allTestResults.failed.add(bookChallengeId);        
        } 
        /*else {
            // unlikely that we want to delete an old test result this way
            allTestResults.passed.delete(bookChallengeId);
            allTestResults.failed.delete(bookChallengeId);            
        }*/
        setAllTestResults(allTestResults); // trigger update
        storeAllResults()
    }

    const storeAllResults = () => {
        localStorage.setItem(encodeURIComponent(bookPath + "-testsPassing"), JSON.stringify([...allTestResults.passed]))
        localStorage.setItem(encodeURIComponent(bookPath + "-testsFailing"), JSON.stringify([...allTestResults.failed]))
    }

    useEffect(() => {
        if (!bookPath || !bookPathAbsolute) {
            setAllTestResults({passed: new Set(), failed: new Set()})
            return;
        }
        setRemainingBookFetches(1)
        fetch(bookPath)
            .then((response) => response.json())
            .then((bookData) => { 
                setData(bookData); 
                expandBookLinks(bookData, bookPathAbsolute.toString(), setRemainingBookFetches); 
                setRemainingBookFetches(ct => ct - 1)
            })
            
        let cacheP = localStorage.getItem(encodeURIComponent(bookPath + "-testsPassing"));
        let cachedPass = cacheP ? JSON.parse(cacheP) : []
        let cacheF = localStorage.getItem(encodeURIComponent(bookPath + "-testsFailing"));
        let cachedFail = cacheF ? JSON.parse(cacheF) : []
        setAllTestResults({passed: new Set(cachedPass), failed: new Set(cachedFail)})
    }, [bookPath,bookPathAbsolute]);

    useEffect(() => {
        if (data) {
            if (bookChallengeId) {
                let node = findBookNode(data, bookChallengeId);
                if (node && node.guide) {
                    setPaths({guidePath: absolutisePath(node.guide, node.bookMainUrl || bookPathAbsolute), 
                        pyPath: node.py ? absolutisePath(node.py, node.bookMainUrl || bookPathAbsolute) : null})
                    setTests(node.tests)
                }
            } else {
                setPaths({guidePath: null, pyPath: null})
            }
        }
    }, [data, bookChallengeId, bookPathAbsolute])

    const openNode = (node: BookNodeModel) => {
        if (!node.children || node.children.length === 0) {
            navigate({search: '?' + new URLSearchParams({"book": bookPath, "chid": node.id}).toString()}, { replace: false });
        } 
    };

    const openDrawer = (open: boolean) => {
        setDrawerOpen(open)
    }

    const requestNextChallenge = () => {
        if (data && bookChallengeId) {
            openNode(nextBookNode(data, bookChallengeId, (node) => node.guide !== undefined))            
        }
    }

    const requestPreviousChallenge = () => {
        if (data && bookChallengeId) {
            openNode(prevBookNode(data, bookChallengeId, (node) => node.guide !== undefined))            
        }
    }

    if (data && remainingBookFetches === 0) {
        if (paths.guidePath && paths.pyPath) {
            return (
                <React.Fragment>
                    <Challenge 
                        guidePath={paths.guidePath} 
                        codePath={paths.pyPath}
                        tests={tests && tests.length > 0 ? tests : null}
                        hasBook={true}
                        openBookDrawer={openDrawer}
                        onRequestPreviousChallenge={requestPreviousChallenge}
                        onRequestNextChallenge={requestNextChallenge}
                        layout="fullscreen"
                        uid={bookPath + bookChallengeId}
                        onTestsPassingChanged={activeTestsPassingChanged}>
                    </Challenge>
                    <BookDrawer 
                        bookRoot={data} 
                        allTestResults={allTestResults} 
                        activePageId={bookChallengeId || undefined} 
                        onRequestOpen={openDrawer}
                        onNodeSelected={openNode}
                        open={drawerOpen}/>
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment> 
                    <BookCover 
                        bookRoot={data} 
                        allTestResults={allTestResults} 
                        onNodeSelected={openNode}/>
                </React.Fragment>
            )
        }
    } else {
        return (
            <p>Loading book... fetching {remainingBookFetches} more files...</p>
        )
    }
}
