import {FacetedIndex,GetDefaultSearchResult} from "./FacetedIndex";
import React from "react";
import records from "./Records";
import SearchFilters from "./SearchFilters";

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
        console.log('query changed:', query);
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