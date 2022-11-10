import React from "react";
import SearchBox from './SearchBox';
import { GetDefaultSearchResult, FacetedIndexInstance, UISettingControl, UISettings, Query, RecordValue, RecordWithMetadata } from "../model";
import Pagination from "./Pagination";
import SearchFilters from "./SearchFilters";
import ActiveFilters from "./ActiveFilters";
import RecordTermTable from "./RecordTermTable";
import QueryUtil from "../model/QueryUtil";
import OffCanvasSearchFilters from "./OffCanvasSearchFilters";
import isTouchDevice from "./isTouchDevice";

const Search = ({ 
  ix,
  debug,
  uiSettingControls,
  uiSettings,
  setUiSettings,
  query,
  setQuery,
  viewSettings,
  currentPageNumber,
  setCurrentPageNumber,
	searchString,
	setSearchString
} : {
  ix: FacetedIndexInstance;
  debug: boolean;
  uiSettingControls: UISettingControl<number|string>[];
  uiSettings: UISettings;
  setUiSettings: (settings: UISettings) => void;
  query: Query;
  setQuery: (fn: (q: Query) => Query) => void;
  viewSettings: () => void;
  currentPageNumber: number,
  setCurrentPageNumber: (p: number) => void,
	searchString: string;
	setSearchString: (ss: string) => void;
}) => {
  const [searchResult, setSearchResult] = React.useState(GetDefaultSearchResult());
  //const [showTermTables, setShowTermTables] = React.useState(false);

	React.useEffect(() => {
    new Promise((resolve) => {
      setTimeout(() => {
        console.log('SEARCHING');
        let r = ix.search(query,searchString);
        setSearchResult(r);
        resolve(r);
      }, 0);
    });
  },[query, searchString]);

  const pagination = 
    <div className="mb-3">
     <Pagination
      recordCount={searchResult.records.length} 
      {...{
        pageSize: parseInt(uiSettings.pageSize),
        currentPageNumber,
        setCurrentPageNumber
      }} />
    </div>;

  const toggleQueryTerm = (facet_id: string, term: string) => {
    setQuery((query: Query) => QueryUtil.toggleFacetTerm(query, facet_id, term));
  };

  const uiOptions = 
    <div className="d-flex justify-content-between align-items-end">
      {pagination}
      <div className="d-flex justify-content-end">
        {uiSettingControls.map(control => 
          <div key={control.label} className="mb-3 ms-3">
            <label className="mb-1">{control.label}</label>
            <select
              className="form-select form-select-sm"
              value={uiSettings[control.key]}
              onChange={e => setUiSettings({...uiSettings, [control.key]: e.target.value}) }
            >
              {control.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>)}
      </div>
    </div>;

  const getResultsPage = (results: RecordWithMetadata[], pageNumber: number, pageSize: number) => 
    results.slice(
      (pageNumber-1)*pageSize,
      (pageNumber-0)*pageSize);

  const [offCanvasOpen, setOffCanvasOpen] = React.useState(true);

  return (
    <div className="row">
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[0]}>
        <SearchBox
          searchString={searchString}
          setSearchString={setSearchString}
          searchResult={searchResult}
          toggleQueryTerm={toggleQueryTerm}
        />
        {isTouchDevice() 
        ? <>
            <button onClick={() => setOffCanvasOpen(true)}>Touch Filters</button>
            <OffCanvasSearchFilters 
              facetHierarchies={searchResult.facetHierarchies}
              open={offCanvasOpen}
              setOpen={setOffCanvasOpen}
              {...{
                debug,
                query,
                setQuery,
                searchResult
              }}
            />
          </>
          : 
          <SearchFilters 
            {...{
              debug,
              query,
              setQuery,
              searchResult
            }}
          />
        }
      </div>
      <div className={"col-" + uiSettings.horizontalSplit.split('/')[1]}>
        <div className="d-flex justify-content-between align-items-start">
          <ActiveFilters 
            query={query}
            clearQuery={() => { setQuery(_ => ({})) }}
            toggleQueryTerm={toggleQueryTerm} 
          />

          <button className="btn btn-outline-secondary" onClick={() => viewSettings()}>
            ⚙️
          </button>
        </div>
        
        <h5 className="mt-3">Results: {searchResult.records.length}</h5>
        {uiOptions}
        <div className={"row row-cols-" + uiSettings.recordsPerRow}>
          {getResultsPage(searchResult.records, currentPageNumber, parseInt(uiSettings.pageSize)).map((r, i) => (
            <div className="col" key={i}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="card-text" style={{overflow:'auto'}}>
                    <pre className="mb-3">{JSON.stringify(r.paired_down_record, null, 2)}</pre>
                    <RecordTermTable
                      record={r.tags as RecordValue}
                      facetIds={searchResult.facets.map(f => f.facet_id)}
                      onClick={toggleQueryTerm}
                      facetTermCount={searchResult.facetTermCount}
                      thWidth={undefined}
                      className={"mb-0"}
                    />
                    {/*
                      <pre className="mt-3 mb-0">
                        {JSON.stringify(r.searchable_text, null, 2)}
                      </pre>
                    */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {uiOptions}
      </div>
    </div>
  );
};

export default Search;