import React from 'react';
import {useLocation} from "react-router-dom";
import Challenge from './Challenge'

export default function Book() {
    const search = useLocation().search;
    const challengeNum = new URLSearchParams(search).get('ch');
    if (challengeNum) {
        return (
            <Challenge guidePath={"c" + challengeNum + ".md"} codePath={"c" + challengeNum + ".py"}></Challenge>
        )
    } else {
        return (
            <p>Challenge not found</p>
        )
    }
}
