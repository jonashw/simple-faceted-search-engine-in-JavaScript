import React from "react";
import { Query } from "../model";
import './ActiveFilters.css';

const ActiveFilters = ({
    query,
    clearQuery,
    toggleQueryTerm
} : {
    query: Query,
    clearQuery: () => void,
    toggleQueryTerm: (facet_id: string, term: string) => void
}) =>  {
    const facets = Object.entries(query);
    const selectedTerms = facets.reduce((termCount,[facet_id,terms]) => termCount+terms.length,0);
    if(facets.length === 0){
        return <div className="text-muted"></div>;
    }
    return <div className="d-flex justify-content-between">
        <div>
            {facets.flatMap(([facetId, terms]) =>
                terms.map((term,i) => (
                    <button className="btn btn-outline-success me-2 mb-2" onClick={() => toggleQueryTerm(facetId,term) } key={facetId + i}>
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