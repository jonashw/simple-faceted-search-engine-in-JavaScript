const intersectAll = (sets) => {
	var result = sets[0] || new Set();
	for (let s of sets.slice(1)) {
		result = new Set([...result].filter((x) => s.has(x)));
	}
	return result;
};
const unionAll = (sets) => {
	let result = new Set();
	for (let s of sets) {
		for (let x of s) {
			result.add(x);
		}
	}
	return result;
};

export {intersectAll,unionAll};