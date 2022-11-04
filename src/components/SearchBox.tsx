import React from "react";
import { SearchResult, TermBucket } from "../model";

type MatchSegment = {text: string, match: boolean};

const matchSegments = (searchString: string, query: string): MatchSegment[] | undefined => {
	if(!query){
		return undefined;
	}
	let splits = searchString.split(query);
	if(splits.length === 1){
		return undefined;
	}
	let splitMatches = [];
	for(let s of splits){
		if(splitMatches.length > 0){
			splitMatches.push({text: query, match:true});
		}
		splitMatches.push({text: s, match: false});
	}
	return splitMatches;
};

type TermMatch = {
	term: TermBucket;
	segments: MatchSegment[]
}

const termMatches = (terms: TermBucket[], q: string): TermMatch[] => 
	!q 
	? [] 
	: terms.map(t => ({
		term: t,
		segments: matchSegments(t.term, q)
	}))
	.filter(tsm => tsm.segments !== undefined)
	.map(tm => tm as TermMatch);

const SearchBox = ({
	searchResult,
	searchString,
	setSearchString,
	toggleQueryTerm
} : {
	searchString: string;
	setSearchString: (ss: string) => void;
	searchResult: SearchResult;
	toggleQueryTerm: (facetId: string, term: string) => void;
}) => {
	const [active,setActive] = React.useState(false);
	const [boxValue, setBoxValue] = React.useState(searchString);
	const searchTaxonomy = false;
	const options = [
		...(!boxValue || true ? [] : [
					<div className="list-group-item list-group-item-action ">
						<a
							onClick={e => {
								e.preventDefault();
								setActive(false);
								setSearchString(boxValue);
							}}
						>
							Search for {boxValue}
						</a>
					</div>]),
		...(!searchTaxonomy ? [] : termMatches(searchResult.terms,boxValue).map(termMatch => 
			<a
				className={"list-group-item list-group-item-action" + (termMatch.term.in_query ? " active" : "")}
				key={termMatch.term.facet_id + "-" + termMatch.term.term}
				href=""
				onFocus={e => e.stopPropagation()}
				onMouseDown={e => e.stopPropagation()}
				style={{fontWeight: termMatch.term.in_query ? 'bold' : 'normal'}}
				onClick={e => {
					e.preventDefault();
					toggleQueryTerm(termMatch.term.facet_id, termMatch.term.term);
					//setActive(false);
					//setSearchString('');
				}}
			>
				<strong>{termMatch.term.facet_id}:</strong> {" "}
				<span>
					{termMatch.segments.map((segment,i) =>
						<span key={segment.text + "-" + i.toString()}>{
							segment.match
							? <span className="bg-warning">{segment.text}</span> 
							: <span>{segment.text}</span>
						}</span>)
					}
				</span>{" "}
				<span className={"badge rounded-pill float-end " + (termMatch.term.in_query ? "bg-secondary" : "bg-light text-dark")}>
					{termMatch.term.count}
				</span>
			</a>
		))
	];
	return <div className="mb-3"
		onBlur={e => {
			/* We only want to blur if the user clicks OUT of the search box.
			** If we don't block in-component blurs, click events on the list-group-items 
			** won't fire when the user clicks them... instead the menu will simply close. 
			** WE MUST AVOID THIS BAD UX. */
			if(!e.currentTarget.contains(e.relatedTarget)){
				setActive(false);
			}
		}}
	>
		<input type="search"
			className="form-control"
			name="search term"
			placeholder="Text Search"
			autoComplete="off"
			autoCorrect="off"
			autoFocus={true}
			value={boxValue}
			onFocus={e => setActive(true)}
			onChange={e => {
				e.preventDefault();
				setSearchString(e.target.value);
				setBoxValue(e.target.value);
			}}
		/>
		{active && options.length > 0 && <div className="list-group" style={{cursor:'pointer'}}>{options}</div>}
	</div>;
}

export default SearchBox;