import {
  Query,
  UISettings
} from "../model";

type AppStateDto = {
  url: string | undefined;
  records_key: string | undefined;
  facet_fields: string[];
  display_fields: string[];
  ui_settings: UISettings | undefined;
  query: Query;
}

export default AppStateDto;