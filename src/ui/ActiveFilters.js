import React from "react";
import './ActiveFilters.css';

const ActiveFilters = ({query,setQuery,ix}) =>  
    <div className="d-flex justify-content-between">
        <div>
            {Object.entries(query).flatMap(([facetId, terms]) =>
                terms.map(term => (
                    <button className="btn btn-outline-success me-2" onClick={() => {
                        let nextQuery = ix.toggleQueryTerm(query, facetId, term);
                        setQuery(nextQuery);
                    }}>
                        {facetId}: {term}
                        <span className="btn-close ms-2" />
                    </button>
                )))}
        </div>
        <button
            className="btn btn-link flex-shrink-0 align-self-start"
            disabled={Object.keys(query).length === 0}
            onClick={() => setQuery({})}
        >
            Reset Search
        </button>
    </div>;

export default ActiveFilters;