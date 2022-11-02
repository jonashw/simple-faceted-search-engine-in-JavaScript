import {
  AppState,
  Blank,
  WithRecords,
  CreateFacetedIndex,
  defaultUiSettings,
  Query,
  uiSettingControls,
  UISettings,
  WithRawData, 
  GetRecordsMetadata
} from "./model";

const qs_cfg = {
  ui_key: 'ui_',
  facet_fields: 'ff',
  display_fields: 'df',
  records_url: 'url',
  records_key: 'key',
  query_facet: 'q_'
}

type AppStateDto = {
  url: string | undefined;
  records_key: string | undefined;
  facet_fields: string[];
  display_fields: string[];
  ui_settings: UISettings | undefined;
  query: Query;
}

const stateToDto = (state: AppState): AppStateDto => {
	switch (state.type) {
    case "blank": 
      return {
        url: state.dataUrl,
        records_key: undefined,
        facet_fields: [],
        display_fields: [],
        ui_settings: undefined,
        query: {}
      };
    case "withRawData": 
      return {
        url: state.previousState.dataUrl,
        records_key: state.recordsKey,
        facet_fields: [],
        display_fields: [],
        ui_settings: undefined,
        query: {}
      };
    case 'withRecords':
      return {
        url: state.previousState.previousState.dataUrl,
        records_key: state.previousState.recordsKey,
        facet_fields: Array.from(state.selectedFieldNames.facet),
        display_fields: Array.from(state.selectedFieldNames.display),
        ui_settings: undefined,
        query: {}
      };
    case 'withIndex':
      return {
        url: state.previousState.previousState.previousState.dataUrl,
        records_key: state.previousState.previousState.recordsKey,
        facet_fields: state.index.actual_facet_fields,
        display_fields: Array.from(state.index.display_fields),
        ui_settings: state.uiSettings,
        query: state.query
      };
    default:
      throw("Unexpected state type: " + eval("state.type"));
  }
};

const deserialize = (params: URLSearchParams): AppStateDto | undefined => {
  const paramsDict: {[key: string]: string[]} = Array.from(params.entries()).reduce(
    (dict, [key, value]) => {
      (dict[key] = dict[key] || []).push(value);
      return dict;
    },
    {} as {[key:string]: string[]}
  );
  if (!paramsDict[qs_cfg.records_url]) {
    return undefined;
  }
  let ui_settings: UISettings =
    Object.fromEntries(uiSettingControls.map(c => {
      let value = c.fromUrl(params.getAll(qs_cfg.ui_key + c.key)[0]);
      return [
        c.key,
        (c.options.indexOf(value) > -1 ? value : c.defaultOption).toString()
      ];
    }));
  let query = 
    Array.from(params.entries())
    .filter(([key,value] : [string,string]) => key.indexOf(qs_cfg.query_facet) === 0)
    .reduce((dict: {[facetName: string]: string[]}, [key,value]: [string,string]) => {
      let facetName = key.replace(qs_cfg.query_facet, '');
      dict[facetName] = dict[facetName] || [];
      dict[facetName].push(value);
      return dict;
    }, {});
    console.log('query',query);
  return {
    url: paramsDict[qs_cfg.records_url][0],
    records_key: paramsDict[qs_cfg.records_key] ? paramsDict[qs_cfg.records_key][0] : undefined,
    facet_fields: paramsDict[qs_cfg.facet_fields] || [],
    display_fields: paramsDict[qs_cfg.display_fields] || [],
    ui_settings,
    query
  };
};

const dtoToState = async (
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
      pageNum: 1,
      pageSize:200,
      query:dto.query,
      uiSettings: dto.ui_settings || defaultUiSettings
    };
  }
  return Promise.resolve(withRecords);
}

const serialize = (dto: AppStateDto) => 
  new URLSearchParams([
    ...(!dto.url ? [] : [[qs_cfg.records_url, dto.url]]),
    ...(!dto.records_key ? [] : [[qs_cfg.records_key, dto.records_key]]),
    ...(!dto.ui_settings ? [] : Object.entries(dto.ui_settings).map(([k,v]) => [qs_cfg.ui_key + k, v])),
    ...dto.facet_fields.map((f) => [qs_cfg.facet_fields, f]),
    ...dto.display_fields.map((f) => [qs_cfg.display_fields, f]),
    ...Object.entries(dto.query).flatMap(([facetName,terms]) => terms.map(t => [qs_cfg.query_facet + facetName, t] ))
  ].filter(([k,v]) => !!v));

const URLCodec = {
  serialize: (state: AppState): URLSearchParams => {
    let dto = stateToDto(state);
    return serialize(dto);
  },
  deserialize: (
    params: URLSearchParams,
    getJson: (url: string) => Promise<any>,
    defaultDataUrl: string
  ): Promise<AppState> => {
    const dto = deserialize(params);
    console.log('AppStateDto',dto);
    return dtoToState(dto, getJson, defaultDataUrl);
  }
};

export {URLCodec};