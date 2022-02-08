import React from "react";
import { useSearchParams } from "react-router-dom";
import SearchFilters from "./SearchFilters";
import {GetDefaultSearchResult} from './FacetedIndex';

const Search = ({ ix,debug }) => {
  const [query, setQuery] = React.useState({});
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  const [searchParams, setSearchParams] = useSearchParams();
  const searchPerformed = Object.keys(searchResult.query).length > 0;
  
  React.useEffect(() => {
    const urlQuery = Array.from(searchParams.entries())
      .filter(([key, value]) => key.indexOf("q_") === 0)
      .map(([key, value]) => [key.replace("q_", ""), value])
      .reduce((dict, [key, value]) => {
        (dict[key] = dict[key] || []).push(value);
        return dict;
      }, {});
    console.log('setting query from url',urlQuery);
    setQuery(urlQuery);
  }, [ix,searchParams]);

  const setQueryFromUI = (query) => {
    let existingPairs = Array.from(searchParams.entries()).filter(
      ([key, value]) => key.indexOf("q_") === -1
    );
    let pairs = Object.entries(query).flatMap(([key, values]) =>
      values.map((v) => ["q_" + key, v])
    );

    setSearchParams(new URLSearchParams(existingPairs.concat(pairs)));
  };

  return (
    <div className="row">
      <div className="col-3">
        <SearchFilters 
          {...{
            ix,
            debug,
            query,
            setQuery: setQueryFromUI,
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
  );
};

export default Search;
