import React from "react";
import SearchBox from './ui/SearchBox';
import { useSearchParams } from "react-router-dom";
import {
  SearchFilters,
  ActiveFilters,
  KeywordInput,
  Pagination
} from "./ui";
import {GetDefaultSearchResult} from './FacetedIndex';

const Search = ({ ix,debug }) => {
  const layoutControls = {
    horizontalSplit: {
      label: 'Horizontal split',
      options: ['1/11','2/10','3/9','4/8'],
      default: '2/10',
      state: React.useState('2/10')
    },
    recordsPerRow: {
      label: 'Records per row',
      options: [1,2,3,4,5],
      default: 2,
      state: React.useState(2)
    },
    pageSize: {
      label:"Results per page",
      options:[10,20,50,100],
      default: 20,
      state: React.useState(20)
    }
  };
  const pageSize = layoutControls.pageSize.state[0];
  const recordsPerRow = layoutControls.recordsPerRow.state[0];
  const [sideBarCols,mainCols] = layoutControls.horizontalSplit.state[0].split('/');
  console.log({pageSize,recordsPerRow,sideBarCols,mainCols});
  const [query, setQuery] = React.useState({});
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  const [searchParams, setSearchParams] = useSearchParams();
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
    searchResult.records.length < pageSize
    ? <></>
    : <Pagination recordCount={searchResult.records.length} {...{pageSize, currentPageNumber, setCurrentPageNumber}} />;


  return (
    <div className="row">
      <div className={"col-" + sideBarCols}>
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
      <div className={"col-" + mainCols}>
        <SearchBox
          terms={ix.terms}
          searchResult={searchResult}
          toggleTerm={(facet_id, term) => {
              let newQuery = ix.toggleQueryTerm(query, facet_id, term);
              setQueryFromUI(newQuery);
          }}
        />
        <ActiveFilters query={query} setQuery={setQueryFromUI} ix={ix}/>
        <div className="d-flex justify-content-start">
          {Object.values(layoutControls).map(control => 
            <div key={control.label} className="mb-3 me-3">
              <label className="mb-1">{control.label}</label>
              <select className="form-select" defaultValue={control.state[0]} onChange={e => control.state[1](e.target.value)}>
                {control.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>)}
        </div>
        <h5 className="mt-3">Results: {searchResult.records.length}</h5>
        {pagination}
        <div className={"row row-cols-" + recordsPerRow}>
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
