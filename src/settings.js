import React from "react";
import './settings.css';

const getJson = async url => {
  try {
    let response = await fetch(url);
    let data = await response.json();
    if (!data) {
      return [];
    } else {
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

const Settings = ({makeUrl}) => {
  const [recordsUrl, setRecordsUrl] = React.useState('sample-records.json');
  const [recordsKey, setRecordsKey] = React.useState();
  const [records, setRecords] = React.useState();
  const [url,setUrl] = React.useState();
  const [fieldNames,setFieldNames] = React.useState();
  const [selectedFacetFieldNames, setSelectedFacetFieldNames] = React.useState(new Set());
  const [selectedDisplayFieldNames, setSelectedDisplayFieldNames] = React.useState(new Set());

  React.useEffect(() => {
    setUrl(makeUrl(recordsUrl, recordsKey, Array.from(selectedFacetFieldNames), Array.from(selectedDisplayFieldNames)));
  },[
    selectedFacetFieldNames,
    selectedDisplayFieldNames
  ])

  const reset = () => {
    setFieldNames();
    setSelectedFacetFieldNames(new Set());
    setSelectedDisplayFieldNames(new Set());
  };

  const loadUrl = async () => {
    setRecords(undefined);
    let data = await getJson(recordsUrl);
    console.log('data',data);
    let records = !!recordsKey ? (data[recordsKey] || []) : data;
    console.log('records',records);
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
    setSelectedDisplayFieldNames(new Set(fieldNames));
    setRecords(records);
  };

  const FieldsToggle = ({
    label,
    description,
    fieldNames,
    selectedFieldNames,
    setSelectedFieldNames
  }) => (
    <div>
      <label className="form-label">
        {label}
      </label>
      <p>
        {description}
      </p>
      {fieldNames.map(f =>
        <label className="form-check" key={f}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={selectedFieldNames.has(f)}
            onChange={() => {
              let newFNs = new Set(selectedFieldNames);
              if (selectedFieldNames.has(f)) {
                newFNs.delete(f);
              } else {
                newFNs.add(f);
              }
              setSelectedFieldNames(newFNs);
            }}
          />
          <span className="form-check-label">
            {f}
          </span>
        </label>)}
    </div>
    );

  return (
    <div className="card">
      <h5 className="card-header">
        Faceted Index Configuration: Data and fields
      </h5>
      <div className="card-body">
        <div className="input-group input-group-lg">
          <div className="form-floating form-floating-group flex-grow-1">
              <input type="text"
                id="json_url"
                disabled={!!fieldNames}
                className="form-control"
                value={recordsUrl}
                onChange={e => setRecordsUrl(e.target.value) 
              }/>
              <label htmlFor="json_url">URL to JSON data</label>
          </div>
          <div className="form-floating form-floating-group flex-grow-1">
              <input type="text"
                id="json_records_key"
                disabled={!!fieldNames}
                className="form-control"
                value={recordsKey}
                onChange={e => setRecordsKey(e.target.value) 
              }/>
              <label htmlFor="json_records_key">Key for records array (leave blank for top-level)</label>
          </div>
          {!fieldNames
          ?
          <button className="btn btn-success"
            onClick={() => loadUrl()}
          >Continue with JSON data</button>
          :
          <button className="btn btn-danger"
            onClick={reset}
          >Clear</button>
          }
        </div>

        {!!fieldNames && 
          <div className="row mt-3">
            <div className="col">
              <FieldsToggle 
                label="Facet Fields"
                description="Select the fields that should be used as facets"
                fieldNames={fieldNames}
                selectedFieldNames={selectedFacetFieldNames}
                setSelectedFieldNames={setSelectedFacetFieldNames}
              />
            </div>
            <div className="col">
              <FieldsToggle 
                label="Display Fields"
                description="Select the fields that should be displayed in search results"
                fieldNames={fieldNames}
                selectedFieldNames={selectedDisplayFieldNames}
                setSelectedFieldNames={setSelectedDisplayFieldNames}
              />
            </div>
          </div>
        }
      </div>
      {!!fieldNames && <div className="card-footer d-grid">
        <a
        className={`btn btn-success btn-lg ${(selectedFacetFieldNames.size === 0 ? "disabled" : "")}`}
        href={url}>
          Begin Faceted Search
        </a>
        {selectedFacetFieldNames.size === 0 && <div className="mt-2"><code>&lt;!&gt;</code> Select at least one field to continue</div>}
      </div>
      }
    </div>
  );
};

export default Settings;