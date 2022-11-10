import { TermBucket } from "../model";
import Select from 'react-select';

const TermBucketSelectMenu = ({
  facet_id,
  term_buckets,
  term_is_selected,
  setFacetQueryTerms
} : {
  facet_id: string,
  term_buckets: TermBucket[],
  term_is_selected: (f: string, t: string) => boolean,
  setFacetQueryTerms:  (f: string, ts: string[]) => void
}) => {
  let options = term_buckets.map(t => ({
    value: t.term,
    in_query: t.in_query,
    label: `${t.term} (${t.count})`
  }));
  let selectedOptions = options.filter(o => o.in_query);
  return <Select 
    onChange={newSelectedOptions => setFacetQueryTerms(facet_id, newSelectedOptions.map(v => v.value) ) }
    getOptionValue={o => o.value}
    isOptionSelected={o => term_is_selected(facet_id,o.value) }
    hideSelectedOptions={true}
    value={selectedOptions}
    options={options}
    isMulti={true} />;
};

export default TermBucketSelectMenu;