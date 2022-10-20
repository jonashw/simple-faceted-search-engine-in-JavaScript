import {FacetedIndex,FacetedIndexConfig} from "./FacetedIndex";
import React  from "react";
import SimpleDemo from "./SimpleDemo";
import App2 from './ui/2.0/App';
import {
  BrowserRouter as Router,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import Search from "./search";
import Settings from "./settings";
import { defaultUiSettings, uiSettingControls, UISettings } from "./ui/2.0/UISettings";

const qs_cfg = {
  ui_key: 'ui',
  facet_fields: 'ff',
  display_fields: 'df',
  records_url: 'url',
  records_key: 'key'
}

type AppSettings = {
  records: {[key:string]: any}[],
  candidate_facet_fields: Set<string>,
  config: {},
  ui: UISettings
};

type AppState = {
  records: {[key: string]: any}[],
  settings: AppSettings
}

export default function App() {
  const useRouterNav = false;
  const navigateViaRouter = useNavigate();
  const navigateViaBrowser = (path: string) => window.location.href = window.location.origin + path;
  const navigate = useRouterNav ? navigateViaRouter : navigateViaBrowser;
  const [settingsVisible, setSettingsVisible] = React.useState(false);

  const [settings, setSettings] = React.useState({
    records: [],
    config: {},
    candidate_facet_fields: new Set([]),
    ui: defaultUiSettings
  } as AppSettings);
  const [debug, setDebug] = React.useState(false);
  const [ix, setIx] = React.useState(FacetedIndex([], {
    facet_fields: [],
    display_fields: [],
    facet_term_parents: {}
  }));
  const [searchParams] = useSearchParams();
  const searchParamsObject = Array.from(searchParams.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {} as {[key:string]: string[]}
  );

  const demo = !!searchParams.get('demo');


  const makeUrl = (
    records_url: string,
    records_key: string,
    facet_fields: string[],
    display_fields: string[],
    ui_settings: {[key:string]: string}
  ) =>
  '?' +
    new URLSearchParams([
      [qs_cfg.records_url, records_url],
      [qs_cfg.records_key, records_key],
      ...(!ui_settings ? [] : Object.entries(ui_settings).map(([k,v]) => [qs_cfg.ui_key + k, v])),
      ...facet_fields.map((f) => [qs_cfg.facet_fields, f]),
      ...display_fields.map((f) => [qs_cfg.display_fields, f])
    ].filter(([k,v]) => !!v));

  React.useEffect(() => {
    const init = async (
      url: string,
      records_key: string | undefined,
      facet_fields: string[],
      display_fields: string[],
      ui_settings: UISettings) => 
    {
      let r = await fetch(url);
      let data = await r.json();
      let records = !!records_key ? data[records_key] : data;
      rebuildIndex({
        ui: ui_settings,
        records_url: url,
        records,
        config: {
          facet_fields,
          display_fields,
          facet_term_parents: {}
        }
      });
    };

    let uiSettings =
      Object.fromEntries(uiSettingControls.map(c => {
        let value = c.fromUrl(searchParams.getAll(qs_cfg.ui_key + '_' + c.key)[0]);
        return [
          c.key,
          c.options.indexOf(value) > -1 ? value : c.defaultOption
        ];
      }));

    if (searchParamsObject[qs_cfg.records_url] && searchParamsObject[qs_cfg.facet_fields]) {

      init(
        searchParamsObject[qs_cfg.records_url][0],
        searchParamsObject[qs_cfg.records_key] ? searchParamsObject[qs_cfg.records_key][0] : undefined,
        searchParamsObject[qs_cfg.facet_fields],
        searchParamsObject[qs_cfg.display_fields],
        uiSettings);
      setDebug(!!searchParamsObject.debug);
      setSettingsVisible(false);
    } else {
      //the app should work with JSON data stored at any URL but we also want a nice introduction to newcomers with sample data
      //reload("sample-records.json", ["days", "color"]);
      setSettingsVisible(true);
    }
  }, []);

  type IndexRebuildSettings = {
    ui: UISettings,
    records_url: string,
    records: {}[],
    config: FacetedIndexConfig
  };

  const rebuildIndex = (s: IndexRebuildSettings) => {
    let ix = FacetedIndex(s.records, {...s.config, facet_term_parents: {}});
    setSettings({...s, candidate_facet_fields: ix.candidate_facet_fields});
    setIx(ix);
  };

  return demo 
    ? <div className="bg-light"><SimpleDemo /></div>
    : settingsVisible 
    ?
      <div className="container mt-3">
        <div className="mb-5" >
          <App2/>
        </div>
        <Settings {...{ settings, rebuildIndex, makeUrl }} />
      </div>
    : <div className="container-fluid bg-light pt-3">
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          style={{float:'right'}}
          onClick={() => setSettingsVisible(true)}
        />
        {!!debug && <pre>{JSON.stringify({...settings,records:'OMMITTED'},null,2)}</pre>}
        <Search {...{
          ix,
          debug,
          makeUrl,
          uiSettingControls: uiSettingControls,
          uiSettings: settings.ui,
          setUiSettings: (ui: UISettings) => setSettings({...settings, ui})}} />
      </div>;
}
