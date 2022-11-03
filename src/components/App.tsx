import React, { useEffect }  from "react";
import { CreateFacetedIndex, AppState, defaultUiSettings, uiSettingControls, UISettings, GetRecordsMetadata, WithRawData } from "../model";
import SearchScreen from "./SearchScreen";
import RecordsExtractor from "./RecordsExtractor";
import StartScreen from "./StartScreen";
import {serialize,deserialize} from "../persistence/AppStateDtoURLCodec";
import AppStateConverter from "../persistence/AppStateConverter";
import { useSearchParams } from "react-router-dom";
import IndexConfiguration from "./IndexConfiguration";
import AppStateImprovedConverter from "../persistence/AppStateImprovedConverter";

const defaultAppState: AppState = 
	{
		type:'blank',
		dataUrl: 'sample-records.json', 
	};

const getJson = async (url:string): Promise<any> => {
	try {
		let response = await fetch(url);

		console.log('response',response, response.headers.get('last-modified'), Array.from(response.headers.entries()));
		let data = await response.json();
		if (!data) {
			return;
		} else {
			//console.log('got data',data);
			return data;
		}
	} catch (e) {
		console.error(e);
		return;
	}
};

export default function App() {
	const [urlParams, setUrlParams] = useSearchParams();
	const [state,setState] = React.useState<AppState>(defaultAppState);
	useEffect(() => {
		const effect = async () => {
			let dto = deserialize(urlParams);
			console.log('AppStateDto',dto);
			let state = await AppStateConverter.fromDto(dto, getJson, 'sample-records.json');
			let newState = await AppStateImprovedConverter.fromDto(dto,getJson);
			setState(state);
			console.log('from URL',state,newState);
		};
		effect();
		/* We want the URL -> state conversion to happen only once, and not repeatedly,
		** so as to avoid an infinite update loop, hence the empty dependency array.
		** If we were to add `urlParams` to the array, we would get the infinite update loop.
		** Let it's commented-out presence stand as a reminder of its peril.  */
	}, [/*urlParams*/]); 

	useEffect(() => {
		let dto = AppStateConverter.toDto(state);
		console.log('dto',dto);
		let urlParams = serialize(dto);
		console.log(`to url: ?${urlParams}`);
		setUrlParams(urlParams);
	}, [state]);

	const extractor = (state: WithRawData) =>
		<>
			<div className="mb-3">
				<StartScreen
					getJson={getJson}
					state={state.previousState}
					clear={() => setState(state.previousState)}
					setState={s => setState({...state, previousState:s})}
					onSuccess={data => 
						setState({
							type:'withRawData',
							data: data,
							recordsKey: '',
							previousState: state.previousState
						})}/>
			</div>
			<RecordsExtractor 
				state={state}
				setState={setState}
				onSuccess={(records) => {
					let metadata = GetRecordsMetadata(records);
					setState({
						type:'withRecords',
						records: records,
						metadata,
						selectedFieldNames: metadata.recommended_selections,
						previousState: state
					})
				}}
			/>
		</>;

	switch (state.type) {
		case "blank": 
			return <StartScreen
							getJson={getJson}
							state={state}
							setState={setState}
							onSuccess={data => setState({
								type:'withRawData',
								data: data,
								recordsKey: '',
								previousState: state
							})}/>;
		case "withRawData":
			return <div>
				{extractor(state)}
				</div>;
		case 'withRecords':
			return <div>
				{extractor(state.previousState)}
				<IndexConfiguration
					state={state}
					setState={setState}
					onSuccess={() => {
						let index = CreateFacetedIndex(
							state.records,
							{
								display_fields: Array.from(state.selectedFieldNames.display),
								facet_fields: Array.from(state.selectedFieldNames.facet),
								facet_term_parents: {}
							});
						setState({
							type:'withIndex',
							pageNum: 1,
							pageSize: 100,
							query: {},
							index, 
							uiSettings: defaultUiSettings,
							previousState: state
						})
					}}
				/>
			</div>;
		case 'withIndex':
			return <div>
				<SearchScreen {...{
					viewSettings: () => setState(state.previousState),
					currentPageNumber: state.pageNum,
					setCurrentPageNumber: (p: number) => setState({...state, pageNum: p}),
					ix: state.index,
					debug: false,
					uiSettingControls,
					query: state.query,
					setQuery: q => setState({...state, query: q}),
					setUiSettings: (ui: UISettings) => setState({...state, uiSettings: ui}),
					uiSettings: state.uiSettings }}/>
			</div>;
		default: 
			throw("Unexpected state type: " + eval("state.type"));
	}
}