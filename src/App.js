import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import records from "./Records";
import React from "react";

var ix = FacetedIndex(records);

export default function App() {
  const [query, setQuery] = React.useState({ day: ["Thursday"] });

  const searchResult = ix.search(query);
  const searchPerformed = Object.keys(searchResult.query).length > 0;

  const toggleSearchTerm = (facetKey, term) => {
    let existingFacetTerms = query[facetKey] || [];
    let newFacetTerms =
      existingFacetTerms.indexOf(term) > -1
        ? existingFacetTerms.filter((t) => t !== term)
        : [...existingFacetTerms, term];
    let newQuery = { ...query, [facetKey]: newFacetTerms };
    if (newQuery[facetKey].length === 0) {
      delete newQuery[facetKey];
    }
    setQuery(newQuery);
  };
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-3">
          {searchResult.facets.map(({ facet_id, term_buckets }) => (
            <div className="mb-3">
              <h4>{facet_id}</h4>
              {term_buckets.map((t) => (
                <div onClick={() => toggleSearchTerm(facet_id, t.term)}>
                  <input type="checkbox" checked={t.in_query} /> {t.term} (
                  {t.count})
                </div>
              ))}
            </div>
          ))}
          <pre>{JSON.stringify(searchResult.query, null, 2)}</pre>
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
          {searchResult.records.map((r) => (
            <div className="card mb-3">
              <div className="card-body">
                <div className="card-text">
                  <pre>{JSON.stringify(r, null, 2)}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
