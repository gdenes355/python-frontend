import React, {useEffect, useState} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Container } from '@mui/material';
import { TreeView,TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function RecursiveItem({node}) {
    const hasChildren = node.children && node.children.length
    return (
        <TreeItem label={node.name} nodeId={node.id}>
          {hasChildren && node.children.map((item) => (
            <RecursiveItem key={item.id} node={item} expanded={true} />
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

export default function BookCover(props) {

    const [expandedIds, setExpandedIds] = useState([])
    const [nodeMap, setNodeMap] = useState({})

    let navigate = useNavigate();
    const { search } = useLocation();

    const handleToggle = (event, nodeIds) => {
        setExpandedIds(nodeIds);
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
        <Container>
            <h1>{props.data.name}</h1>
            <TreeView
                aria-label="multi-select"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                expanded={expandedIds}
                onNodeToggle={handleToggle}
                onNodeSelect={handleSelect}
                sx={{  maxWidth: 400, }}>
                    <RecursiveItem node={props.data}></RecursiveItem>
            </TreeView>
        </Container>
    )
}