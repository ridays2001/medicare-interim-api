import fetch from 'node-fetch';
import { Router } from 'express';
const router = Router();

router.get('/doctors', async (_, res) => {
	const doctors = await fetch('http://localhost:8080/practitioners', {
		method: 'GET',
		headers: {
			Authorization: process.env.TOKEN as string
		}
	}).then((res) => res.json());
	return res.status(200).json(doctors);
});

router.get('/stores', async (_, res) => {
	const stores = await fetch('http://localhost:8080/stores', {
		method: 'GET',
		headers: {
			Authorization: process.env.TOKEN as string
		}
	}).then((res) => res.json());
	return res.status(200).json(stores);
});

router.get('/meds', async (req, res) => {
	const { search } = req.query;
	const data = (await fetch(`https://api.fda.gov/drug/drugsfda.json?limit=5&search=openfda.brand_name:${search}`, {
		method: 'GET',
		headers: {
			Authorization: `Basic ${process.env.FDA_API_KEY as string}`
		}
	}).then((res) => res.json())) as {
		results: Array<{
			openfda: {
				generic_name: Array<string>;
				brand_name: Array<string>;
				manufacturer_name: Array<string>;
				product_type: Array<string>;
				route: Array<string>;
			};
		}>;
	};

	// Some shit error handling...
	if (!data?.results) {
		return res.status(500).json({ error: 'Not Found' });
	}
	return res.status(200).json({
		data: data.results.map((r) => ({
			generic: r.openfda.generic_name[0],
			brand: r.openfda.brand_name[0],
			manufacturer: r.openfda.manufacturer_name[0],
			route: r.openfda.route[0]
		}))
	});
});

export default router;
