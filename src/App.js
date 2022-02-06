import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import Search from "./search";
import Settings from "./settings";

const qs_cfg = {
  facet_fields: 'ff',
  display_fields: 'df',
  records_url: 'url'
}

export default function App() {
  const useRouterNav = false;
  const navigateViaRouter = useNavigate();
  const navigateViaBrowser = (path) => window.location.href = window.location.origin + path;
  const navigate = useRouterNav ? navigateViaRouter : navigateViaBrowser;
  const [settingsVisible, setSettingsVisible] = React.useState(false);

  const [settings, setSettings] = React.useState({ records: [], config: {}, candidate_facet_fields: [] });
  const [debug, setDebug] = React.useState(false);
  const [ix, setIx] = React.useState(FacetedIndex([], { facet_fields: [] }));
  const [searchParams] = useSearchParams();
  const searchParamsObject = Array.from(searchParams.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {}
  );

  const makeUrl = (records_url, facet_fields, display_fields) =>
  '?' +
    new URLSearchParams([
      [qs_cfg.records_url, records_url],
      ...facet_fields.map((f) => [qs_cfg.facet_fields, f]),
      ...display_fields.map((f) => [qs_cfg.display_fields, f])
    ]);

  const reload = (records_url, facet_fields, display_fields) => {
    let url = makeUrl(records_url, facet_fields, display_fields);
    navigate(url);
  };

  React.useEffect(() => {
    const init = async (url, facet_fields, display_fields) => {
      let r = await fetch(url);
      let records = await r.json();
      rebuildIndex({
        records_url: url,
        records,
        config: {
          facet_fields,
          display_fields
        }
      });
    };
    if (searchParamsObject[qs_cfg.records_url] && searchParamsObject[qs_cfg.facet_fields]) {
      init(searchParamsObject[qs_cfg.records_url][0], searchParamsObject[qs_cfg.facet_fields], searchParamsObject[qs_cfg.display_fields]);
      setDebug(!!searchParamsObject.debug);
      setSettingsVisible(false);
    } else {
      //the app should work with JSON data stored at any URL but we also want a nice introduction to newcomers with sample data
      //reload("sample-records.json", ["days", "color"]);
      setSettingsVisible(true);
    }
  }, []);

  const rebuildIndex = (s) => {
    let ix = FacetedIndex(s.records, s.config);
    setSettings({...s, candidate_facet_fields: ix.candidate_facet_fields});
    setIx(ix);
  };

  return settingsVisible 
    ?
      <div className="container mt-3">
        <Settings {...{ settings, rebuildIndex, makeUrl }} />
      </div>
    : <div className="container-fluid mt-3">
        <button type="button" className="btn-close" aria-label="Close" style={{float:'right'}} onClick={() => setSettingsVisible(true)}></button>
        <Search {...{ix,debug}} />
      </div>;
}
