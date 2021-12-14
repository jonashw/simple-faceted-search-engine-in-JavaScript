import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import records from "./Records";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link
} from "react-router-dom";

export default function App() {
  const [formJsonData, setFormJsonData] = React.useState("");
  const [formJsonConfig, setFormJsonConfig] = React.useState("");
  const [ix, setIx] = React.useState(
    FacetedIndex(records, {
      facet_fields: ["days", "color", "priority"]
    })
  );
  React.useEffect(() => {
    setFormJsonData(JSON.stringify(ix.records, null, 2));
    setFormJsonConfig(JSON.stringify(ix.config, null, 2));
  }, [ix]);

  const [query, setQuery] = React.useState({});

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

  const Search = ({}) => (
    <div className="row">
      <div className="col-3">
        {searchResult.facets
          .filter((f) => f.term_buckets.length > 0)
          .map(({ facet_id, term_buckets }) => (
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
  );

  const Settings = ({ setIx }) => {
    const changeData = () => {
      var data = JSON.parse(formJsonData);
      var cfg = JSON.parse(formJsonConfig);

      if (!data || !Array.isArray(data) || !cfg) {
        alert("sorry, invalid data");
      } else {
        setIx(FacetedIndex(data, cfg));
      }
    };
    return (
      <div>
        <div className="row">
          <div className="col-6">
            <label className="form-label">Records</label>
            <textarea
              className="form-control"
              rows={20}
              placeholder="[records]"
              value={formJsonData}
              onChange={(e) => setFormJsonData(e.target.value)}
            ></textarea>
          </div>
          <div className="col-6">
            <label className="form-label">Config</label>
            <textarea
              className="form-control"
              rows={20}
              placeholder="{config}"
              value={formJsonConfig}
              onChange={(e) => setFormJsonConfig(e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="d-grid my-2">
          <button
            className="btn btn-primary"
            onClick={() => changeData(formJsonData)}
          >
            Update Index
          </button>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="container-fluid">
        <nav className="my-3">
          <ul className="nav nav-tabs">
            {[
              ["Search", "/"],
              ["Settings", "/settings"]
            ].map(([label, path]) => (
              <li className="nav-item">
                <NavLink
                  activeClassName="active"
                  className="nav-link"
                  to={path}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Routes>
          <Route path="/settings" element={<Settings setIx={setIx} />} />
          <Route path="/" element={<Search />} />
        </Routes>
      </div>
    </Router>
  );
}
