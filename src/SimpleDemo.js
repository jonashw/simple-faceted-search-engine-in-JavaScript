import {FacetedIndex,GetDefaultSearchResult} from "./FacetedIndex";
import React from "react";
import records from "./Records";
import SearchFilters from "./SearchFilters";
import RecordTermTable from './RecordTermTable';

const SimpleDemo = ({}) => {
    let ix = FacetedIndex(records, {
        facet_fields:   ["days","color","length","priority"],
        display_fields: []
    });
    const [query, setQuery] = React.useState({"days":["Monday"]});
    const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
    const searchPerformed = Object.keys(searchResult.query).length > 0;
    const debug = true;

    const toggleFacetTerm = (query, facetId, term) => {
        //Isn't this a re-implementation?  TODO: Share the best one via context or similar.
        let prevFacetTerms = query[facetId] || [];
        let nextFacetTerms = 
            prevFacetTerms.indexOf(term) === -1
            ? [...prevFacetTerms, term ]
            : prevFacetTerms.filter(p => p !== term);
        let nextQuery = 
            nextFacetTerms.length === 0
            ? Object.fromEntries(Object.entries(query).filter(([k,v]) => k !== facetId))
            : {...query, [facetId]: nextFacetTerms}
        setQuery(nextQuery);
    }

    const facetTermCount = (facet,term) => 
        //((ix.data[facet] || new Set())[term]  || new Set()).size;
        ((searchResult.term_buckets_by_facet_id[facet] || {})[term]  || {count:0}).count;

    React.useEffect(() => {
        console.log('query changed:', Object.fromEntries(Object.entries(query).map(([k,v]) => [k, v.join(", ")])), query);
        console.log(ix);
    }, [query]);

    return (
        <div className="container">
        <div className="row">
            <div className="col-3">
                <SearchFilters
                    {...{
                        ix,
                        debug,
                        query,
                        setQuery,
                        searchResult,
                        setSearchResult
                    }}
                />
            </div>
            <div className="col-9">
                {searchPerformed && (
                    <button
                        className="btn float-end btn-link btn-sm"
                        onClick={() => setQuery({})}
                    >
                        Reset
                    </button>
                )}
                <h5>Results: {searchResult.records.length}</h5>
                {searchResult.records.map((r, i) => (
                    <div className="card mb-3" key={i}>
                        <div className="card-body">
                            <div className="card-text">
                                <RecordTermTable 
                                    record={r}
                                    facetIds={ix.actual_facet_fields}
                                    facetTermCount={facetTermCount}
                                    onClick={(facetId,term) => {
                                        toggleFacetTerm(query, facetId, term);
                                    }}
                                />
                                <pre className="mb-0">{JSON.stringify(r, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </div>
    );
};

export default SimpleDemo;