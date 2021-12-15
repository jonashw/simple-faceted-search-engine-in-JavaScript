import React from "react";
import { useSearchParams } from "react-router-dom";
const Search = ({ ix }) => {
  let [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = Array.from(searchParams.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {}
  );
  const [query, setQuery] = React.useState(urlQuery);

  const searchResult = ix.search(query);
  const searchPerformed = Object.keys(searchResult.query).length > 0;

  React.useEffect(() => {
    let pairs = Object.entries(query).flatMap(([key, values]) =>
      values.map((v) => [key, v])
    );
    setSearchParams(new URLSearchParams(pairs));
  }, [query, setSearchParams]);

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
    <div className="row">
      <div className="col-3">
        {searchResult.facets
          .filter((f) => f.term_buckets.length > 0)
          .map(({ facet_id, term_buckets }) => (
            <div className="mb-3" key={facet_id}>
              <h4>{facet_id}</h4>
              {term_buckets.map((t) => (
                <label className="form-check" key={t.term}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={t.in_query}
                    onChange={() => toggleSearchTerm(facet_id, t.term)}
                  />
                  <span className="form-check-label">
                    {t.term} ({t.count})
                  </span>
                </label>
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
        {searchResult.records.map((r, i) => (
          <div className="card mb-3" key={i}>
            <div className="card-body">
              <div className="card-text">
                <pre>{JSON.stringify(r, null, 2)}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
