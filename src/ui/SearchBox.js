import React from "react";

const matchSegments = (searchString, query) => {
	if(!query){
		return;
	}
	let splits = searchString.split(query);
	if(splits.length === 1){
			return;
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

const termMatches = (terms, q) => !q ? [] : terms.map(t => ({
	term: t,
	segments: matchSegments(t.term, q)
})).filter(tsm => !!tsm.segments);

const SearchBox = ({searchResult,toggleQueryTerm}) => {
	const [active,setActive] = React.useState(false);
	const [q,setQ] = React.useState('');
	const options = [
		...(!q || true  /* enable text search later */ ? [] : [<div className="list-group-item list-group-item-action ">Search for {q}</div>]),
		...termMatches(searchResult.terms,q).map(termMatch => 
				<a
					className={"list-group-item list-group-item-action" + (termMatch.term.in_query ? " active" : "")}
					key={termMatch.term.facet_id + "-" + termMatch.term.term}
					href="javascript:void(0)"
					onFocus={e => e.stopPropagation()}
					onMouseDown={e => e.stopPropagation()}
					onClick={e => {
						toggleQueryTerm(termMatch.term.facet_id, termMatch.term.term);
					}}
				>
					<span className="badge rounded-pill bg-secondary">
						{termMatch.segments.map((segment,i) =>
							<span key={segment.text + "-" + i.toString()}>{
								segment.match
								? <span className="bg-secondary" style={{filter:'invert(1)'}}>{segment.text}</span> 
								: <span>{segment.text}</span>
							}</span>)
						}
					</span>
					{" "}({termMatch.term.facet_id})
				</a>)
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
		<input type="text"
			className="form-control"
			placeholder="Search"
			onFocus={e => setActive(true)}
			onChange={e => setQ(e.target.value)}
		/>
		{active && options.length > 0 && <div className="list-group" style={{cursor:'pointer'}}>{options}</div>}
	</div>;
}

export default SearchBox;