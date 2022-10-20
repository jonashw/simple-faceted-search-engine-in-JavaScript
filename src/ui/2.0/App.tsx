import React  from "react";
import { FacetedIndex } from "../../FacetedIndex";
import Search from "../../search";
import {AppState} from './model';
import RecordsExtractor from "./RecordsExtractor";
import StartScreen from "./StartScreen";
import { defaultUiSettings, uiSettingControls } from "./UISettings";

const defaultAppState: AppState = {type:'blank', dataUrl: 'sample-records.json'}

export default function App2() {
	const [state,setState] = React.useState<AppState>(defaultAppState);
	switch (state.type) {
			case "blank": 
				return <StartScreen
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
									state={state.previousState}
									clear={() => setState(state.previousState)}
									setState={s => setState({...state, previousState:s})}
									onSuccess={data => setState({type:'withRawData',data: data, recordsKey: '', previousState: state.previousState})}/>
						</div>
						<RecordsExtractor 
							state={state}
							setState={setState}
							onSuccess={(records,facet_fields,display_fields) => {
								let index = FacetedIndex(records,{display_fields,facet_fields,facet_term_parents: {}});
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
					<button className="float-right" onClick={() => setState(state.previousState)}>
						Configure
					</button>
					<Search {...{
						ix: state.index,
						debug: false,
						uiSettingControls,
						setUiSettings: (ui:any) => {},
						uiSettings: state.uiSettings }}/>
				</div>;
			default: 
				throw("Unexpected state type: " + eval("state.type"));
	}
}