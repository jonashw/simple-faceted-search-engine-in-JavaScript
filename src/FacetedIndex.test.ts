import { FacetedIndex } from "./FacetedIndex";

describe("The Faceted Index term hierarchy", () => {
	const ix = FacetedIndex([
		{
			location:'Sacramento',
			rating: 6
		},
		{
			location:'Los Angeles',
			rating: 7
		},
		{
			location:'San Francisco',
			rating: 9
		},
		{
			location:'San Diego',
			rating: 10
		},
		{
			location:'New York City',
			rating: 10
		},
	],{
		facet_fields: [],
		display_fields: [],
		facet_term_parents: {
			location: {
				'Sacramento': 'California',
				'Los Angeles': 'California',
				'San Francisco': 'California',
				'San Diego': 'California',
				'New York City': 'New York',
				'New York': 'USA',
				'California': 'USA'
			}
		}
	});
	it('can be used to retrieve records with parent-child relationship', () => {
		let q = {location:['California']};
		let result = ix.search(q);
		expect(result.records).toHaveLength(4);
	});
	it('can be used to retrieve records with a grandparent-child relationship', () => {
		let q = {location:['USA']};
		let result = ix.search(q);
		expect(result.records).toHaveLength(5);
	});
	it('can offers hierarchical facets available to the UI, alpha-sorted', () => {
		let q = {location:['USA']};
		let result = ix.search(q);
		let locationFacet = result.facetHierarchies.filter(f => f.facet_id === 'location')[0];
		expect(locationFacet).not.toBeUndefined();
		expect(locationFacet.term_buckets).toHaveLength(1);
		let california = locationFacet.term_buckets[0].children.filter(b => b.term === 'California')[0];
		expect(california.children.map(c => c.term).join()).toBe('Los Angeles,Sacramento,San Diego,San Francisco');
	});
})

describe("The Faceted Index", () => {
	const ix = FacetedIndex([
		{
			color:'Yellow',
			difficulty: 'Medium'
		},
		{
			color:'Red',
			difficulty: 'Hard'
		},
		{
			color:'Blue',
			difficulty: 'Easy'
		}
	],{
		facet_fields: [],
		display_fields: [],
		facet_term_parents: { }
	});

	let q = {color:['Red']};
	let result = ix.search(q);

	it('returns the input facets', () =>  expect(result.facets).toHaveLength(2));
	it('returns facet terms alpha-sorted', () =>  {
		let terms = 
			result.facets
			.filter(f => f.facet_id === 'color')[0]
			.term_buckets.map(b => b.term);
		expect(terms.join()).toBe(['Blue','Red','Yellow'].join())
	});
	it('provides easy access to term counts', () => expect(result.facetTermCount('color','Red')).toBe(1));
	it('returns 1 result', () =>  expect(result.records).toHaveLength(1));
	it('returns the same query that was sent', ( )=> expect(result.query).toEqual(q));
})