import {Field, FieldValue, RecordValue, RecordsMetadata} from './types';

const GetRecordsMetadata = (records: RecordValue[]): RecordsMetadata => {
	if(!records || records.length === 0){
		return {
			fields: [],
			fieldNames: [],
			valuesByFieldName: {},
			recommended_selections: {
				display: new Set<string>(),
				facet: new Set<string>()
			}
		};
	}
	let ks = new Set<string>();
	let vs_by_k = new Map<string,Set<string|number>>();
	for(let record of records){
		for(let [k,v] of Object.entries(record)){
			ks.add(k);
			if(typeof v === "number" || typeof v === "string"){
				let vs = vs_by_k.get(k)  || new Set<string|number>();
				vs.add(v);
				vs_by_k.set(k, vs);
			}
			if(Array.isArray(v)){
				for(let v_ of v){
					if(typeof v_ === "number" || typeof v_ === "string"){
						let vs = vs_by_k.get(k)  || new Set<string|number>();
						vs.add(v_);
						vs_by_k.set(k, vs);
					}
				}
			}
		}
	}

	let valuesByFieldName = Object.fromEntries(vs_by_k.entries());

	const fieldNames = Array.from(ks);
	console.log(fieldNames,valuesByFieldName);
	const fields: Field[] = fieldNames.map((fn: string) => ({
		name: fn,
		values: valuesByFieldName[fn] || new Set<FieldValue>()
	}));

	let facet = 
		new Set<string>(
			fields.filter(f =>
				/* A facet is useful only if it has at least 2 values,
				** and the more values a field gets, the less likely it is a facet. */
				2 <= f.values.size && f.values.size < 15
			).map(f => f.name));

	return {
		fields,
		fieldNames,
		valuesByFieldName,
		recommended_selections: {
			display: new Set<string>(fields.map(f => f.name).filter(fn => !facet.has(fn))),
			facet
		}
	};
};

export {GetRecordsMetadata};