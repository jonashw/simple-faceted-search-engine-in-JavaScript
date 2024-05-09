import React  from "react";
import {Record} from '../model';
import { JsonViewer } from '@textea/json-viewer'

const StandardJsonViewer = ({
	data
} : {
	data: any
}) => 
	<div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #ddd', padding:'1em'}}>
		<JsonViewer
			value={data}
			groupArraysAfterLength={100}
			theme={"light"}
			indentWidth={4}
			enableClipboard={false}
			displaySize={true}
			displayDataTypes={false}/>
	</div>;

export default ({
	rawData,
	recordsKey,
	setRecordsKey,
	onSuccess
}: {
	rawData: any,
	recordsKey: string,
	setRecordsKey: (recordsKey: string) => void,
	onSuccess: (records: Record[]) => void
}) => {
	let data = recordsKey === '' ? rawData : rawData[recordsKey];
	let records: Record[] | undefined = 
		Array.isArray(data) && data.every(item => typeof item === 'object') 
		? data 
		: undefined;

	React.useEffect(() => {
		if(!!records){
			onSuccess(records);
		}
	},[records]);

	const firstNRecords = 4;
	return <div>
		<div className="form-floating form-floating-group flex-grow-1 mb-3">
			<input type="text"
				id="records_key"
				className="form-control"
				defaultValue={recordsKey}
				onChange={e => setRecordsKey(e.target.value) 
			}/>
			<label htmlFor="records_key">Key for records array (leave blank for root-level)</label>
		</div>
		{!records && <div>
			<div className="alert alert-danger">
				<span className="badge rounded-pill bg-danger me-2">OOPS</span>
				Didn't find array of objects.
				Please provide property name that holds an array of objects.
			</div>
			<StandardJsonViewer data={rawData}/>
		</div>}
		{!!records && <div>
			<p> Array found with {records.length} records.  Showing first {Math.min(records.length, firstNRecords)}:  </p>
			<div className="d-flex justify-content-between">
				{records.slice(0,firstNRecords).map((r,i) => <StandardJsonViewer key={i} data={r}/>)}
			</div>
		</div>}
	</div>;
}