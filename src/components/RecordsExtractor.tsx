import React  from "react";
import {WithRawData} from '../model';
import { JsonViewer } from '@textea/json-viewer'
import {Record,GetRecordsMetadata} from '../model/index';

const StandardJsonViewer = ({data} : {data: any}) => 
	<div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #ddd', padding:'1em'}}>
		<JsonViewer
			value={data}
			groupArraysAfterLength={100}
			theme={"light"}
			indentWidth={4}
			enableClipboard={false}
			displayObjectSize={true}
			displayDataTypes={false}/>
	</div>;

type FieldsToggleParams = {
	label: string,
	description: string,
	fieldNames: string[],
	fieldValues?: {[fn: string]: Set<string|number>},
	selectedFieldNames: Set<string>,
	setSelectedFieldNames: (fns: Set<string>) => void
}

const FieldsToggle = ({
	label,
	description,
	fieldNames,
	selectedFieldNames,
	setSelectedFieldNames,
	fieldValues
}: FieldsToggleParams) => (
	<div>
		<label className="form-label h5">
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
						let newFNs = new Set<string>(selectedFieldNames);
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
					{!!fieldValues && (f in fieldValues) && 
						<span
							className="text-muted"
							title={Array.from(fieldValues[f]).sort().join('\n')}>
								{' ' }({fieldValues[f].size} unique values)
						</span>
					}
				</span>
			</label>)}
	</div>
);


type RecordsExtractorProps = {
	state: WithRawData,
	setState: (newState: WithRawData) => void,
	onSuccess: (
		records: {[key: string]: any}[],
		facet_fields: string[],
		display_fields: string[]
	) => void
};

export default ({state,setState,onSuccess,}: RecordsExtractorProps) => {
	let data = state.recordsKey === '' ? state.data : state.data[state.recordsKey];
	let records: Record[] | undefined = 
		Array.isArray(data) && data.every(item => typeof item === 'object') 
		? data 
		: undefined;

	let {fields,fieldNames,valuesByFieldName} = GetRecordsMetadata(records || []);

  const [selectedFieldNames, setSelectedFieldNames] = React.useState({
		display: new Set<string>(fields.map(f => f.name)),
		facet: new Set<string>(
			fields.filter(f =>
			 	/* A facet is useful only if it has at least 2 values,
				** and the more values a field gets, the less likely it is a facet. */
				2 <= f.values.size && f.values.size < 10
			).map(f => f.name))
	});

	let canBeginFacetedSearch =
		//gotta have records
		!!records 
		//gotta have fields to search at all!
		&& selectedFieldNames.facet.size > 0 && selectedFieldNames.display.size > 0;

	const firstNRecords = 4;
	return <div>
		<div className="form-floating form-floating-group flex-grow-1 mb-3">
				<input type="text"
					id="records_key"
					className="form-control"
					defaultValue={state.recordsKey}
					onChange={e => setState({...state, recordsKey: e.target.value}) 
				}/>
				<label htmlFor="records_key">Key for records array (leave blank for top-level)</label>
		</div>
		{!records && <div>
			<p>
				Didn't find array of objects.  Please provide property name that holds an array of objects.
			</p>
			<StandardJsonViewer data={state.data}/>
		</div>}
		{!!records && <div>
			<p> Array found with {records.length} records.  Showing first {Math.min(records.length, firstNRecords)}:  </p>
			<div className="d-flex justify-content-between">
				{records.slice(0,firstNRecords).map((r,i) => <StandardJsonViewer key={i} data={r}/>)}
			</div>
			<div className="row mt-3">
				<div className="col">
					<FieldsToggle 
						label="Facet Fields"
						description="Select the fields that should be used as facets"
						fieldNames={fieldNames}
						fieldValues={valuesByFieldName}
						selectedFieldNames={selectedFieldNames.facet}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, facet: fns} )}
					/>

				</div>
				<div className="col">
					<FieldsToggle 
						label="Display Fields"
						description="Select the fields that should be displayed in search results"
						fieldNames={fieldNames}
						selectedFieldNames={selectedFieldNames.display}
						setSelectedFieldNames={(fns: Set<string>) => setSelectedFieldNames({...selectedFieldNames, display: fns} )}
					/>
				</div>

			</div>
		</div>}
		<div className="d-grid mt-3">
			<button
				className="btn btn-success btn-lg"
				disabled={!canBeginFacetedSearch}
				onClick={() => onSuccess(
					             	records || [],
												Array.from(selectedFieldNames.facet),
												Array.from(selectedFieldNames.display))}
			>
				Begin Faceted Search
			</button>
		</div>
		{/*
		<pre className="bordered-primary" style={{border:'1px solid #ddd',padding:'1em',maxHeight:'200px'}}>
			{JSON.stringify(state.data,null,2)}
		</pre>
		*/}
	</div>;
}