import {TestCases} from './Tests'

type BookNodeModel = {
    name: string,
    id: string,
    children?: BookNodeModel[],
    py?: string,
    guide?: string,
    tests: TestCases
}

const findBookNode: (node: BookNodeModel, id: String) => BookNodeModel | null = (node, id) => {
    if (node.id === id) {
        return node;
    }
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            let res = findBookNode(node.children[i], id)
            if (res) {
                return res;
            }
        }
    }
    return null;
}

export default BookNodeModel;
export {findBookNode}; 
