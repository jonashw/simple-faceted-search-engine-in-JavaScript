import {serialize, deserialize} from "./AppStateDtoURLCodec";
import {
  AppState,
  Blank,
  WithRecords,
  CreateFacetedIndex,
  defaultUiSettings,
  WithRawData, 
  GetRecordsMetadata
} from "../model";

import AppStateDto from "./AppStateDto";

export default {
  toDto: (state: AppState): AppStateDto => {
    switch (state.type) {
      case "blank": 
        return {
          url: state.dataUrl,
          records_key: undefined,
          facet_fields: [],
          display_fields: [],
          ui_settings: undefined,
          query: {},
          pageNum: undefined
        };
      case "withRawData": 
        return {
          url: state.previousState.dataUrl,
          records_key: state.recordsKey,
          facet_fields: [],
          display_fields: [],
          ui_settings: undefined,
          query: {},
          pageNum: undefined
        };
      case 'withRecords':
        return {
          url: state.previousState.previousState.dataUrl,
          records_key: state.previousState.recordsKey,
          facet_fields: Array.from(state.selectedFieldNames.facet),
          display_fields: Array.from(state.selectedFieldNames.display),
          ui_settings: undefined,
          query: {},
          pageNum: undefined
        };
      case 'withIndex':
        return {
          url: state.previousState.previousState.previousState.dataUrl,
          records_key: state.previousState.previousState.recordsKey,
          facet_fields: state.index.actual_facet_fields,
          display_fields: Array.from(state.index.display_fields),
          ui_settings: state.uiSettings,
          query: state.query,
          pageNum: state.pageNum
        };
      default:
        throw("Unexpected state type: " + eval("state.type"));
    }
  },
  fromDto: async (
    dto: AppStateDto | undefined,
    getJson: (url: string) => Promise<any>,
    defaultDataUrl: string
  ): Promise<AppState> => {
    let defaultState: Blank = {
      type:'blank',
      dataUrl: defaultDataUrl, 
    };
    if(dto === undefined || !dto.url){
      return Promise.resolve(defaultState);
    }
    let blank: Blank = {type:'blank', dataUrl: dto.url};
    let data = await getJson(dto.url);
    if(!data){
      return blank;
    }
    let records = !!dto.records_key ? data[dto.records_key] : data;
    let withRawData: WithRawData = {
      type:'withRawData',
      recordsKey: dto.records_key || "", //?????
      data: data,
      previousState: blank
    };
    if(!Array.isArray(records)){
      return withRawData;
    }
    let metadata = GetRecordsMetadata(records);
    let withRecords: WithRecords = {
      type: "withRecords",
      records: records,
      selectedFieldNames: {
        facet: new Set<string>(dto.facet_fields.length === 0 ? metadata.recommended_selections.facet : dto.facet_fields),
        display: new Set<string>(dto.display_fields.length === 0 ? metadata.recommended_selections.display : dto.display_fields)
      },
      metadata,
      previousState: withRawData
    }
    if(dto.facet_fields.length > 0 && dto.display_fields.length > 0){
      let index = CreateFacetedIndex(records, {
        display_fields: dto.display_fields,
        facet_fields: dto.facet_fields,
        facet_term_parents: {}
      });
      return {
        type: 'withIndex',
        previousState: withRecords,
        index,
        pageNum: dto.pageNum || 1,
        pageSize:200,
        query:dto.query,
        uiSettings: dto.ui_settings || defaultUiSettings
      };
    }
    return Promise.resolve(withRecords);
  }
};