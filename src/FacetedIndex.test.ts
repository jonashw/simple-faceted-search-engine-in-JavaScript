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
		console.log(ix.data);
		expect(result.records).toHaveLength(5);
	});
})

describe("The Faceted Index", () => {
	const ix = FacetedIndex([
		{
			color:'Red',
			difficulty: 'Hard'
		}
	],{
		facet_fields: [],
		display_fields: [],
		facet_term_parents: { }
	});

	let q = {color:['Red']};
	let result = ix.search(q);

	it('returns 2 facets', () =>  expect(result.facets).toHaveLength(2));
	it('returns 2 terms', () =>  expect(result.terms).toHaveLength(2));
	it('provides easy access to term counts', () => expect(result.facetTermCount('color','Red')).toBe(1));
	it('returns 1 result', () =>  expect(result.records).toHaveLength(1));
	it('returns the same query that was sent', ( )=> expect(result.query).toEqual(q));
})