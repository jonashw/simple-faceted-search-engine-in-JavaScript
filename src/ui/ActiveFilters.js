import React from "react";
import './ActiveFilters.css';

const ActiveFilters = ({query,setQuery,ix}) =>  {
    const facets = Object.entries(query);
    return facets.length === 0 ? <></> : <div className="d-flex justify-content-between mb-3">
        <div>
            {facets.flatMap(([facetId, terms]) =>
                terms.map((term,i) => (
                    <button className="btn btn-outline-success me-2" onClick={() => {
                        let nextQuery = ix.toggleQueryTerm(query, facetId, term);
                        setQuery(nextQuery);
                    }} key={i}>
                        {facetId}: {term}
                        <span className="btn-close ms-2" />
                    </button>
            )))}
            {facets.length > 1 && <button
                className="btn btn-link"
                disabled={Object.keys(query).length === 0}
                onClick={() => setQuery({})}
            >
                Remove Filters
            </button>}
        </div>
    </div>;
}

export default ActiveFilters;