import {
  FacetTermParents,
  Query,
  UISettings
} from "../model";

type AppStateDto = {
  facet_term_parents: FacetTermParents,
  search_string: string | undefined,
  url: string | undefined;
  records_key: string | undefined;
  facet_fields: string[];
  display_fields: string[];
  ui_settings: UISettings | undefined;
  query: Query;
  pageNum: undefined | number;
}

export default AppStateDto;