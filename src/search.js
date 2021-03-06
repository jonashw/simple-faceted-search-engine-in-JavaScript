import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  SearchFilters,
  ActiveFilters,
  KeywordInput,
  Pagination
} from "./ui";
import {GetDefaultSearchResult} from './FacetedIndex';

const Search = ({ ix,debug }) => {
  const [query, setQuery] = React.useState({});
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageSize,setPageSize] = React.useState(20);
  const pageSizeOptions = [10,20,50,100];
  const [currentPageNumber,setCurrentPageNumber] = React.useState(1);
  
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

  const pagination = 
    <Pagination recordCount={searchResult.records.length} {...{pageSize, setPageSize, pageSizeOptions, currentPageNumber, setCurrentPageNumber}} />;

  return (
    <div className="row">
      <div className="col-2">
        <KeywordInput {...{ix,query,setQuery}} />
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
      <div className="col-10">

        <ActiveFilters query={query} setQuery={setQuery} ix={ix}/>
        <h5 className="mt-3">Results: {searchResult.records.length}</h5>
        {pagination}
        <div className="row row-cols-2">
          {ix.getResultsPage(searchResult.records, currentPageNumber, pageSize).map((r, i) => (
            <div className="col" key={i}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="card-text">
                    <pre className="mb-0">{JSON.stringify(r, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {pagination}
      </div>
    </div>
  );
};

export default Search;
