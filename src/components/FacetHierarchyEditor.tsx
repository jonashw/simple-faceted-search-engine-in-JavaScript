//WIP
import React from "react";
import { FieldValue, ChildParentRelations} from "../model/types";

{/* Sample usage

<h5 className="mt-3">Facet Hierarchy</h5>
<p>Specify any Child &rarr; Parent relationships between facet terms</p>
<div className="row">
	{Array.from(selectedFieldNames.facet).map(fn => 
		<div className="col-4">
			<FacetHierarchyEditor 
				facetName={fn}
				terms={Array.from(valuesByFieldName[fn] || new Set<FieldValue>())}
				/>
		</div>)}
</div>

*/}

const FacetHierarchyEditor = ({
	facetName,
	terms
} : {
	facetName: string;
	terms: FieldValue[]
}) => {
	const [availableTerms, setAvailableTerms] = React.useState<FieldValue[]>(terms);
	const [childParentRelations/*, setChildParentRelations*/] = React.useState<ChildParentRelations>({});
	const [newTerms, setNewTerms] = React.useState<FieldValue[]>([]);
	return <div>
		<label className="form-label">
			{facetName}
		</label>
		<div>
			<input type="text" defaultValue={newTerms.join(", ")} 
			onChange={e => {
				let ts = e.target.value.split(',').map(t => t.trim() as FieldValue);
				setNewTerms(ts);
				setAvailableTerms(at => [...at, ...ts])
				console.log(ts);
			}}/>
			{Object.entries(childParentRelations).map(([childTerm,parentTerm]) => 
				<div key={childTerm}>{childTerm} &rarr; {parentTerm}</div>
			)}
			<div className="d-flex justify-content-between">
				<div className="flex-grow-1">
					<select className="form-select">
						<option></option>
						{availableTerms.map(t => 
							<option value={t} key={t}>{t}</option>)}
					</select>
				</div>
				<div className="px-3" style={{alignSelf:"center"}}>
					&rarr;
				</div>
				<div className="flex-grow-1">
					<select className="form-select">
						<option></option>
						{availableTerms.map(t => 
							<option value={t} key={t}>{t}</option>)}
					</select>
				</div>
			</div>
			<select className="form-select">
				<option></option>
				{availableTerms.map(t => 
					<option value={t} key={t}>{t}</option>)}
			</select>
		</div>
	</div>;
}

export default FacetHierarchyEditor;