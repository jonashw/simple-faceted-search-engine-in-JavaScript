import React, { useEffect }  from "react";
import {
	AppState,
	DataState,
	IndexConfigState,
	SearchState,
	CreateFacetedIndex,
	defaultUiSettings,
	uiSettingControls,
	UISettings,
	GetRecordsMetadata 
} from "../model";
import Search from "./Search";
import RecordsExtractor from "./RecordsExtractor";
import DataSourceForm from "./DataSourceForm";
import {serialize,deserialize} from "../persistence/AppStateDtoURLCodec";
import { useSearchParams } from "react-router-dom";
import IndexConfiguration from "./IndexConfiguration";
import AppStateConverter from "../persistence/AppStateConverter";

const defaultAppState: AppState = 
	{
		dataUrl: '',
		dataState: undefined
	};

function withNonNull<T>(
	ambiguousValue: T|undefined,
	handleNonNull: (actualValue: T) => JSX.Element
) {
	if(ambiguousValue === undefined){
		return;
	}
	return handleNonNull(ambiguousValue as T);
}

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
	const [settingsVisible,setSettingsVisible] = React.useState<boolean>(
		state.dataState?.indexConfigState?.searchState === undefined
	);

	useEffect(() => {
		const effect = async () => {
			let dto = deserialize(urlParams);
			console.log('AppStateDto',dto);
			//let state = await AppStateConverter.fromDto(dto, getJson, 'sample-records.json');
			let newState = await AppStateConverter.fromDto(dto,getJson);
			setState(newState);
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

	const setDataState = (dataState: DataState | undefined) =>
		setState({...state, dataState});

	const setIndexConfigState = (indexConfigState: IndexConfigState | undefined) =>
		setDataState(
			state.dataState === undefined 
			? undefined 
			: {
				...state.dataState,
				indexConfigState
			});

	const setSearchState = (searchState: SearchState | undefined) =>
		setIndexConfigState(
			state.dataState?.indexConfigState === undefined 
			? undefined 
			: {
				...state.dataState?.indexConfigState,
				searchState
			});

	return (
		<div>
			<div className="mb-3">
				<DataSourceForm
					getJson={getJson}
					dataUrl={state.dataUrl || defaultAppState.dataUrl || ""}
					clear={state.dataState === undefined ? undefined : () => {
						setState(defaultAppState);
						setSettingsVisible(true);
					}}
					setDataUrl={dataUrl => setState({...state, dataUrl})}
					onSuccess={(dataUrl,rawData) => setState({
						...state,
						dataUrl,
						dataState: {
							rawData, 
							recordsKey: '',
							indexConfigState: undefined
						}
					})}/>
			</div>
			{settingsVisible && 
				<div>
					{withNonNull(state.dataState, dataState =>
						<div className="mb-3">
							<RecordsExtractor 
								rawData={dataState.rawData}
								recordsKey={dataState.recordsKey || ''}
								setRecordsKey={(recordsKey: string) => 
									setDataState({
										...dataState,
										recordsKey
									})}
								onSuccess={(records) => {
									let metadata = GetRecordsMetadata(records);
									setDataState({
										...dataState,
										indexConfigState: {
											metadata,
											records,
											selectedFieldNames: metadata.recommended_selections,
											facetTermParents: {},
											searchState: undefined
										}
									})
								}}
							/>
						</div>
					)}
					{withNonNull(state.dataState?.indexConfigState, indexConfigState => 
						<div className="mb-3">
							<IndexConfiguration
								metadata={indexConfigState.metadata}
								selectedFieldNames={indexConfigState.selectedFieldNames}
								setSelectedFieldNames={selectedFieldNames => setIndexConfigState({...indexConfigState, selectedFieldNames})}
								facetTermParents={indexConfigState.facetTermParents}
								setFacetTermParents={facetTermParents => setIndexConfigState({...indexConfigState, facetTermParents})}
								onSuccess={() => {
									setSettingsVisible(false);
									let index = CreateFacetedIndex(
										indexConfigState.records,
										{
											facet_term_parents: indexConfigState.facetTermParents,
											fields: {
												facet: new Set(indexConfigState.selectedFieldNames.facet),
												display: new Set(indexConfigState.selectedFieldNames.display),
											}
										});
									setIndexConfigState({
										...indexConfigState,
										searchState: {
											searchString: '',
											index,
											pageNum: 1,
											pageSize: 100,//REQUIRED?
											query: {},
											uiSettings: defaultUiSettings
										}
									});
								}}
							/>
						</div>
					)}
				</div>
			}
			{withNonNull(state.dataState?.indexConfigState?.searchState, searchState => 
				<div className="mb-3">
					<Search {...{
						viewSettings: () => {
							setSettingsVisible(true);
						},
						currentPageNumber: searchState.pageNum,
						setCurrentPageNumber: (p: number) => setSearchState({...searchState, pageNum: p}),
						ix: searchState.index,
						debug: false,
						uiSettingControls,
						query: searchState.query,
						searchString: searchState.searchString,
						setSearchString: (searchString: string) => setSearchState({...searchState, searchString}),
						setQuery: fn => setSearchState({...searchState, query: fn(searchState.query)}),
						setUiSettings: (ui: UISettings) => setSearchState({...searchState, uiSettings: ui}),
						uiSettings: searchState.uiSettings }}/>
				</div>
			)}
		</div>
	);
}