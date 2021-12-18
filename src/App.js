import "./styles.css";
import FacetedIndex from "./FacetedIndex";
import React from "react";
import Select from 'react-select'
import {
  useSearchParams
} from "react-router-dom";
import Search from "./search";

const qs_cfg = {
  facet_fields: 'ff',
  records_url: 'url'
}

const getJsonArray = async url => {
  try {
    let records = await fetch(url).then((r) => r.json());
    if (!records || !Array.isArray(records)) {
      return [];
    } else {
      return records;
    }
  } catch (e) {
    console.error(e);
  }
};

export default function App() {
  const [settings, setSettings] = React.useState({ records: [], config: {}, candidate_facet_fields: [] });
  const [records, setRecords] = React.useState();
  const [fieldNames,setFieldNames] = React.useState();
  const [selectedFieldNames, setSelectedFieldNames] = React.useState(new Set());
  const [debug, setDebug] = React.useState(false);
  const [ix, setIx] = React.useState();
  const [searchParams] = useSearchParams();
  const searchParamsObject = Array.from(searchParams.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {}
  );

  const makeUrl = (records_url, facet_fields) =>
  '?' +
    new URLSearchParams([
      [qs_cfg.records_url, records_url],
      ...facet_fields.map((f) => [qs_cfg.facet_fields, f])
    ]);


  const loadUrl = async () => {
    setRecords(undefined);
    var records = await getJsonArray(settings.records_url);
    if(!records){
      alert("invalid URL or JSON data");
      return;
    }
    var fieldNames = new Set();
    for(let r of records){
      for(let k of Object.keys(r)){
        fieldNames.add(k);
      }
    }
    setFieldNames(Array.from(fieldNames));
    setRecords(records);
  };

  const init = async (url, facet_fields) => {
    let r = await fetch(url);
    let records = await r.json();
    rebuildIndex({
      records_url: url,
      records,
      config: {
        facet_fields
      }
    });
  };

  React.useEffect(() => {
    setDebug(!!searchParamsObject.debug);
    if (searchParamsObject[qs_cfg.records_url]){
      let records_url = searchParamsObject[qs_cfg.records_url][0];
      setSettings({...settings, records_url });
      if(searchParamsObject[qs_cfg.facet_fields]) {
        init(records_url, searchParamsObject[qs_cfg.facet_fields]);
      }
    }
  }, []);

  const rebuildIndex = (s) => {
    let ix = FacetedIndex(s.records, s.config);
    setSettings({...s, candidate_facet_fields: ix.candidate_facet_fields});
    setIx(ix);
  };

  return (
    <div className="container-fluid mt-3">
      <form onSubmit={e => {
        loadUrl();
        e.preventDefault();
      }}>
        <div className="input-group">
          <div className="form-floating form-floating-group flex-grow-1">
              <input type="text"
                id="json_url"
                className="form-control"
                value={settings.records_url}
                onChange={e => {
                  setSettings({...settings, records_url: e.target.value})
                  setIx();
                  setFieldNames();
                }}/>
              <label htmlFor="json_url">URL to JSON data</label>
          </div>
        </div>
      </form>
      {!!fieldNames && 
        <div className="mt-3 d-flex align-items-center">
          <label className="me-3">
            Facet Fields
          </label>
    
          <Select 
            className="flex-fill"
            autoFocus={true}
            defaultMenuIsOpen={true}
            blurInputOnSelect={false}
            closeMenuOnSelect={false}
            onChange={selectedOptions => {
              let fns = selectedOptions.map(v => v.value);
              setSelectedFieldNames(new Set(fns));
              setIx(FacetedIndex(records, {facet_fields: fns } ));
            }}
            options={fieldNames.map(fn => ({
              value: fn,
              label: fn
            }))}
            isMulti={true}
          />
        </div>
      }
      {!!ix && 
        <div>
          <hr/>
          <Search {...{ix,debug}} />
        </div>
        }
    </div>
  );
}