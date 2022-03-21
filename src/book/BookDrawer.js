import React, {useEffect, useState} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { TreeView,TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {Box,Drawer}  from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneIcon from '@mui/icons-material/Done';

function RecursiveItem({node, allTestResults}) {
    const hasChildren = node.children && node.children.length
    return (
        <TreeItem label={<div>{allTestResults.passed.has(node.id) ? <DoneIcon></DoneIcon> : (allTestResults.failed.has(node.id) ? <CancelIcon></CancelIcon> : null) }{node.name}</div>} nodeId={node.id}>
          {hasChildren && node.children.map((item) => (
            <RecursiveItem key={item.id} node={item} allTestResults={allTestResults} expanded={true} />
          ))}
        </TreeItem>
      )
}

function extractAllIds(node, arr, dict) {
    arr.push(node.id)
    dict[node.id] = {hasChildren: node.children ? true : false}
    if (node.children) {
        for (let child of node.children) {
            extractAllIds(child, arr, dict);
        }
    }
}

export default function BookDrawer(props) {

    const [expandedIds, setExpandedIds] = useState([])
    const [nodeMap, setNodeMap] = useState({})

    let navigate = useNavigate();
    const { search } = useLocation();

    const handleToggle = (event, nodeIds) => {
        setExpandedIds(nodeIds)
    };

    const handleSelect = (event, nodeIds) => {
        if (!nodeMap[nodeIds].hasChildren) {
            navigate({search: '?' + new URLSearchParams({"book": new URLSearchParams(search).get("book"), "chid": nodeIds}).toString()}, { replace: false });
        } 
    };

    useEffect(() => {
        let ids = []
        let dict = {}
        extractAllIds(props.data, ids, dict)
        setNodeMap(dict);
        setExpandedIds(ids)
    }, [props]);
    return (
        <Drawer anchor='right' open={props.open} onClose={() => props.onToggle(false)}>
            <Box
            sx={{ width:  250 }}
            role="presentation">
                <TreeView
                    aria-label="multi-select"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    expanded={expandedIds}
                    selected={props.activePage}
                    onNodeToggle={handleToggle}
                    onNodeSelect={handleSelect}
                    sx={{  maxWidth: 400, }}>
                        <RecursiveItem node={props.data} allTestResults={props.allTestResults}></RecursiveItem>
                </TreeView>
            </Box>
        </Drawer>
    )
}
