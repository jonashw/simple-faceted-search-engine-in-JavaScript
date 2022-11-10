import { HierarchicalTermBucket } from "../model";

const TermBucketLinks = ({
  facet_id,
  term_buckets,
  term_is_selected,
  level,
  toggleFacetTerm
} : {
  facet_id: string,
  term_buckets: HierarchicalTermBucket[],
  term_is_selected: (f: string, t: string) => boolean,
  level: number,
  toggleFacetTerm: (f: string, t: string) => void
}) =>
  <div>
    {term_buckets.map((t,i) => {
      let selected = term_is_selected(facet_id, t.term);
      return (
        <div key={i}>
          <a key={t.term}
            href=""
            className="link-primary pb-1"
            style={{ textDecoration: 'none', fontWeight: selected ? '700' : 'normal', display:'block'}}
            onClick={(e) => {
              e.preventDefault();
              toggleFacetTerm(facet_id, t.term);
            }}
          >
            {t.term}
            <span className={"badge rounded-pill float-end " + (selected ? "bg-success" : "bg-light text-dark")}>
              {t.count}
            </span>
          </a>
          {('children' in t) && t.children.length > 0 && 
            <div style={{paddingLeft: `${level*10}px`}}>
              <TermBucketLinks {...{
                facet_id,
                term_buckets: t.children,
                term_is_selected,
                level: level + 1,
                toggleFacetTerm
              }} />
            </div>}
        </div>
      );
    })}
  </div>;

export default TermBucketLinks;

  /*
  const TermBucketCheckBoxes = ({facet_id, term_buckets, term_is_selected}) =>
    term_buckets.map((t) => {
      let selected = term_is_selected(t.term);
      return (
        <label className="form-check" key={t.term}>
          <input
            className="form-check-input"
            type="checkbox"
            checked={selected}
            onChange={() => {
              let newQuery = ix.toggleQueryTerm(query, facet_id, t.term);
              setQuery(newQuery);
            }}
          />
          <span className="form-check-label">
            {t.term}
          </span>
          <span className={"badge rounded-pill float-end " + (selected ? "bg-success" : "bg-light text-dark")}>
            {t.count}
          </span>
        </label>
      );
    });
  */