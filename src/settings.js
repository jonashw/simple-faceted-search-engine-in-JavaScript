import React from "react";

const Settings = ({ settings, rebuildIndex }) => {
  const [recordsJson, setRecordsJson] = React.useState([]);
  const [configJson, setConfigJson] = React.useState({});

  React.useEffect(() => {
    setRecordsJson(JSON.stringify(settings.records, null, 2));
    setConfigJson(JSON.stringify(settings.config, null, 2));
  }, [settings]);

  const submit = () => {
    var records = JSON.parse(recordsJson);
    var config = JSON.parse(configJson);

    if (!records || !Array.isArray(records) || !config) {
      alert("sorry, invalid data");
    } else {
      rebuildIndex({ records, config });
    }
  };

  return (
    <div>
      <div className="row">
        <div className="col-6">
          <label className="form-label">Records (JSON)</label>
          <textarea
            className="form-control"
            rows={20}
            placeholder="[records]"
            value={recordsJson}
            onChange={(e) => setRecordsJson(e.target.value)}
          ></textarea>
        </div>
        <div className="col-6">
          <label className="form-label">Config (JSON)</label>
          <textarea
            className="form-control"
            rows={20}
            placeholder="{config}"
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
          ></textarea>
        </div>
      </div>
      <div className="d-grid my-2">
        <button className="btn btn-primary" onClick={() => submit()}>
          Update Index
        </button>
      </div>
    </div>
  );
};

export default Settings;
