import React from "react";
import SearchBox from './SearchBox';
import { GetDefaultSearchResult, FacetedIndexInstance, UISettingControl, UISettings, Query, RecordValue, RecordWithMetadata, SearchResult } from "../model";
import Pagination from "./Pagination";
import SearchFilters from "./SearchFilters";
import ActiveFilters from "./ActiveFilters";
import QueryUtil from "../model/QueryUtil";
import OffCanvasSearchFilters from "./OffCanvasSearchFilters";
import isTouchDevice from "./isTouchDevice";
import RecordRows from "./RecordRows";

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

  const [activeTerms,setActiveTerms] = React.useState(new Set());
  const term_is_selected = (k: string, t: string) => activeTerms.has(`${k}:${t}`);

  React.useEffect(() => {
    let allTerms = Object.entries(query).flatMap(([facet,terms]) => terms.map(t => `${facet}:${t}`));
    setActiveTerms(new Set(allTerms));
  }, [query])

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

  const [offCanvasOpen, setOffCanvasOpen] = React.useState(false);

  return isTouchDevice() 
    ? <>
      <div style={{
        position:'sticky',
        top:0,
        zIndex:100,
        borderBottom:'1px solid #ddd'
      }} className="bg-white py-2 mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <span>
            Showing {searchResult.recordCounts.filtered} of {searchResult.recordCounts.total} records
          </span>
          <button
            onClick={() => setOffCanvasOpen(true)}
            className="btn btn-outline-secondary"
          >
            Filter
            <img src="/filter.svg" alt="Filters" className="ps-2"/>
          </button>
        </div>

      </div>
      {pagination}

      <OffCanvasSearchFilters 
        recordCounts={searchResult.recordCounts}
        facetHierarchies={searchResult.facetHierarchies}
        open={offCanvasOpen}
        setOpen={setOffCanvasOpen}
        {...{
          debug,
          query,
          setQuery,
          searchResult,
          term_is_selected
        }}
      />
      <RecordRows {...{
        searchResult,
        currentPageNumber,
        pageSize: parseInt(uiSettings.pageSize),
        recordsPerRow: parseInt(uiSettings.recordsPerRow),
        toggleQueryTerm
      }} />
      {pagination}
    </>
    : <div className="row">
        <div className={"col-" + uiSettings.horizontalSplit.split('/')[0]}>
          <SearchBox
            searchString={searchString}
            setSearchString={setSearchString}
            searchResult={searchResult}
            toggleQueryTerm={toggleQueryTerm}
          />
            
          <SearchFilters 
            {...{
              debug,
              query,
              setQuery,
              searchResult,
              term_is_selected
            }}
          />
          
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
          <RecordRows {...{
            searchResult,
            currentPageNumber,
            pageSize: parseInt(uiSettings.pageSize),
            recordsPerRow: parseInt(uiSettings.recordsPerRow),
            toggleQueryTerm
          }} />
          {uiOptions}
        </div>
      </div>;
};

export default Search;