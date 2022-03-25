import React, {useEffect, useState} from 'react'

import { TreeView,TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/Done';

import BookNodeModel from '../models/BookNodeModel'
import {AllTestResults} from '../models/Tests'

type BookContentsProps = {
    bookRoot: BookNodeModel,
    activePageId?: string,
    allTestResults: AllTestResults,
    onNodeSelected: (node: BookNodeModel) => void
}


type RecursiveArgs = {
    node: BookNodeModel, 
    allTestResults: AllTestResults
}

function RecursiveItem({node, allTestResults}: RecursiveArgs) {
    const hasChildren = node.children && node.children.length
    return (
        <TreeItem label={<div>{allTestResults.passed.has(node.id) ? <DoneIcon></DoneIcon> : (allTestResults.failed.has(node.id) ? <CancelIcon></CancelIcon> : null) }{node.name}</div>} nodeId={node.id}>
          {hasChildren && node.children?.map((item) => (
            <RecursiveItem key={item.id} node={item} allTestResults={allTestResults} />
          ))}
        </TreeItem>
      )
}

function extractAllIds(node: BookNodeModel, arr: string[], dict: Map<string,BookNodeModel>) {
    arr.push(node.id);
    dict.set(node.id, node);
    if (node.children) {
        for (let child of node.children) {
            extractAllIds(child, arr, dict);
        }
    }
}

const BookContents = (props: BookContentsProps) => {

    const [expandedIds, setExpandedIds] = useState<string[]>([])
    const [nodeMap] = useState<Map<string, BookNodeModel>>(new Map())

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpandedIds(nodeIds)
    };

    const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
        let selectedNode = nodeMap.get(nodeId);
        
        if (selectedNode) {
            props.onNodeSelected(selectedNode);
        } 
    }

    useEffect(() => {
        let ids: string[] = []
        extractAllIds(props.bookRoot, ids, nodeMap)
        setExpandedIds(ids)
    }, [props, nodeMap]);

    return (
        <TreeView
            aria-label="multi-select"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            expanded={expandedIds}
            selected={props.activePageId}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            sx={{  maxWidth: 400, }}>
                <RecursiveItem node={props.bookRoot} allTestResults={props.allTestResults}></RecursiveItem>
        </TreeView>
    )
}

export default BookContents;