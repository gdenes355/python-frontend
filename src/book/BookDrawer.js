import React, {useEffect, useState} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { TreeView,TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {Box,Drawer}  from '@mui/material';

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

function extractAllIds(node, arr) {
    arr.push(node.id)
    for (let child in node.children) {
        extractAllIds(child, arr);
    }
}

export default function BookDrawer(props) {

    const [expandedIds, setExpandedIds] = useState([])

    let navigate = useNavigate();
    const { search } = useLocation();

    const handleToggle = (event, nodeIds) => {
        setExpandedIds(nodeIds);
    };

    const handleSelect = (event, nodeIds) => {
        navigate({search: '?' + new URLSearchParams({"book": new URLSearchParams(search).get("book"), "chid": nodeIds}).toString()}, { replace: false });
      };

    useEffect(() => {
        let ids = []
        extractAllIds(props.data, ids)
        setExpandedIds(ids);
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
                    onNodeToggle={handleToggle}
                    onNodeSelect={handleSelect}
                    sx={{  maxWidth: 400, }}>
                        <RecursiveItem node={props.data}></RecursiveItem>
                </TreeView>
            </Box>
        </Drawer>
    )
}
