import React, { useEffect }  from "react";
import { CreateFacetedIndex, AppState, defaultUiSettings, uiSettingControls, UISettings } from "../model";
import SearchScreen from "./SearchScreen";
import RecordsExtractor from "./RecordsExtractor";
import StartScreen from "./StartScreen";
import { URLCodec } from "../URLCodec";
import { useSearchParams } from "react-router-dom";

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
			let state = await URLCodec.deserialize(urlParams, getJson, 'sample-records.json');
			setState(state);
			console.log('from URL',state);
		};
		effect();
		/* We want the URL -> state conversion to happen only once, and not repeatedly,
		** so as to avoid a circular update loop. */
	}, [/*urlParams*/]); 

	useEffect(() => {
		let urlParams = URLCodec.serialize(state);
		console.log(`to url: ?${urlParams}`);
		setUrlParams(urlParams);
	}, [state]);

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
					onSuccess={(records,facet_fields,display_fields) => {
						let index = CreateFacetedIndex(records,{display_fields,facet_fields,facet_term_parents: {}});
						setState({
							type:'withIndex',
							pageNum: 1,
							pageSize: 100,
							query: {},
							index, 
							uiSettings: defaultUiSettings,
							previousState: state
						})
					}}/>
				</div>;
		case 'withIndex':
			return <div>
				<SearchScreen {...{
					viewSettings: () => setState(state.previousState),
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