// Ensure `self` exists in server runtime
try {
	if (typeof globalThis !== 'undefined' && typeof (globalThis).self === 'undefined') {
		(globalThis).self = globalThis;
	}
} catch (_err) {
	// ignore
}


