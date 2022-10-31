import React from "react";
import './ActiveFilters.css';

const ActiveFilters = ({query,clearQuery,toggleQueryTerm}) =>  {
    const facets = Object.entries(query);
    const selectedTerms = facets.reduce((termCount,[facet_id,terms]) => termCount+terms.length,0);
    return facets.length === 0 ? <></> : <div className="d-flex justify-content-between mb-3">
        <div>
            {facets.flatMap(([facetId, terms]) =>
                terms.map((term,i) => (
                    <button className="btn btn-outline-success me-2" onClick={() => toggleQueryTerm(facetId,term) } key={i}>
                        {facetId}: {term}
                        <span className="btn-close ms-2" />
                    </button>
            )))}
            {selectedTerms > 1 && <button
                className="btn btn-link"
                onClick={() => clearQuery()}
            >
                Remove Filters
            </button>}
        </div>
    </div>;
}

export default ActiveFilters;