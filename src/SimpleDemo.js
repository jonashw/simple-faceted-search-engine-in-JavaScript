import {FacetedIndex,GetDefaultSearchResult} from "./FacetedIndex";
import React from "react";
import records from "./Records";
import {
    SearchFilters,
    RecordTermTable
} from "./ui";

const SimpleDemo = ({}) => {
    let ix = FacetedIndex(records, {
        facet_fields:   ["days","color","length","priority"],
        display_fields: []
    });
    const [query, setQuery] = React.useState({"days":["Monday"]});
    const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
    const searchPerformed = Object.keys(searchResult.query).length > 0;
    const debug = true;

    React.useEffect(() => {
        if(debug){
            console.log('query changed:', Object.fromEntries(Object.entries(query).map(([k,v]) => [k, v.join(", ")])), query);
            console.log(ix);
        }
    }, [query]);

    return (
        <div className="container-fluid">
        <div className="row">
            <div className="col-2">
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
            <div className="col-10">
                {searchPerformed && (
                    <button
                        className="btn float-end btn-link btn-sm"
                        onClick={() => setQuery({})}
                    >
                        Reset
                    </button>
                )}
                <h5>Results: {searchResult.records.length}</h5>
                <div className="row row-cols-2">
                    {searchResult.records.map((r, i) => (
                        <div className="col" key={i}>
                            <RecordTermTable 
                                thWidth="200px"
                                className="mb-3"
                                record={r}
                                facetIds={ix.actual_facet_fields}
                                facetTermCount={searchResult.facetTermCount}
                                onClick={(facetId,term) => {
                                    let nextQuery = ix.toggleQueryTerm(query, facetId, term);
                                    setQuery(nextQuery);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </div>
    );
};

export default SimpleDemo;