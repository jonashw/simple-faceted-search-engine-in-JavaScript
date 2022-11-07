import { Taxonomy,TaxonomyNode } from "../model/types";
type ParseError = string;
const FacetedHierarchyConverter = {
    serializeToTabIndentedString: (t: Taxonomy): string => {
        const tabs = (n: number): string =>
            Array(n).fill('\t').join('');
        const traverse = (n: TaxonomyNode, indentLevel: number): string => 
            [
                tabs(indentLevel) + n.name,
                ...n.children.map(c => traverse(c, indentLevel+1))
            ].join('\n');
        return t.map(f => traverse(f,0)).join('\n');
    },
	parseTabIndentedString: (str:string): Taxonomy | ParseError => {
		const tree: Taxonomy = [];
		const lines = str.split('\n');
		const tab = '\t';
		const deIndent = (s: string): [number,string] =>
		{
			let n = 0;
			let ss = s;
			while(ss[0] === tab){
				ss = ss.slice(1);
				n++;
			}
			return [n,ss.trim()];
		};
		let nodeStack: TaxonomyNode[] = [];
        let lineNum = 0;
		for(let l of lines){
            lineNum++;
			let [n, ll] = deIndent(l);
			let node = {name: ll, children: []};
			if(n === nodeStack.length){
				//child
				let siblings = 
					nodeStack.length === 0 
					? tree 
					: nodeStack[nodeStack.length - 1].children;
				siblings.push(node);
				nodeStack.push(node);
			} else if (n < nodeStack.length) {
				//sibling or ancestor
				for(let i=n; i<=nodeStack.length; i++){
					nodeStack.pop();
				}
				let siblings = 
					nodeStack.length === 0 
					? tree 
					: nodeStack[nodeStack.length - 1].children;
				siblings.push(node);
				nodeStack.push(node);
			} else {
				return `INVALID INDENTATION ON LINE ${lineNum}`;
			}
		}
		return tree;
	}
};

export default FacetedHierarchyConverter;