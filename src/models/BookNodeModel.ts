import {TestCases} from './Tests'

type BookNodeModel = {
    name: string,
    id: string,
    children?: BookNodeModel[],
    py?: string,
    md?: string,
    tests: TestCases
}

export default BookNodeModel; 