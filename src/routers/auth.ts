import fetch from 'node-fetch';
import { encrypt } from '../util/cryptography';
import { User } from '../util/types';

import { Router } from 'express';
const router = Router();

type RegisterFormValues = {
	name: string;
	username: string;
	dob: string;
	email: string;
	password: string;
};

const getUsers = async () => {
	return fetch('http://localhost:8080/users', {
		method: 'GET',
		headers: {
			Authorization: process.env.TOKEN as string
		}
	}).then((res) => res.json()) as Promise<Array<User>>;
};

router.post('/register', async (req, res) => {
	const { dob, email, name, password, username } = req.body as RegisterFormValues;
	if (!dob?.length || !email?.length || !name?.length || !password?.length || !username?.length) {
		return res.status(500).end('Error: Incomplete Details!');
	}

	const users: Array<User> = await getUsers();

	const isRegistered = users.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.username === username);
	if (isRegistered) {
		return res.status(501).end('Error: Already registered!');
	}

	const { code } = (await fetch('http://localhost:8000', {
		method: 'POST',
		body: JSON.stringify({ email, username, type: 'verify' }),
		headers: {
			Authorization: process.env.PASSWORD as string,
			'Content-Type': 'application/json'
		}
	}).then((res) => res.json())) as { email: string; code: string };

	await fetch('http://localhost:8080/users/register', {
		method: 'POST',
		body: JSON.stringify({
			dob,
			email,
			name,
			password: encrypt(password),
			username,
			verified: false,
			verificationCode: encrypt(code),
			resetRequested: false,
			resetCode: 'undefined'
		} as User),
		headers: {
			Authorization: process.env.TOKEN as string,
			'Content-Type': 'application/json'
		}
	});

	res.status(200).end(encrypt(username));
});

router.post('/login', async (req, res) => {
	const { username, password } = req.body as { username: string; password: string };
	if (!username?.length || !password?.length) {
		return res.status(500).end('Error: Incomplete details!');
	}

	const users: Array<User> = await getUsers();

	const matchedUser = users.find((u) => u.username === username);
	if (!matchedUser) {
		return res.status(501).end('Error: User does not exist!');
	}

	if (matchedUser.password !== encrypt(password)) {
		return res.status(502).end('Error: Invalid credentials!');
	}

	return res.status(200).end(encrypt(username));
});

router.post('/reset-password', async (req, res) => {
	const { email, username } = req.body as { username: string; email: string };
	if (!username?.length || !email?.length) {
		return res.status(500).end('Error: Incomplete details!');
	}

	const users: Array<User> = await getUsers();

	const matchedUser = users.find((u) => u.username === username);
	if (!matchedUser) {
		return res.status(501).end('Error: User does not exist!');
	}

	if (matchedUser.email !== email) {
		return res.status(502).end('Error: Invalid credentials!');
	}

	const { code } = (await fetch('http://localhost:8000', {
		method: 'POST',
		body: JSON.stringify({ email, username, type: 'reset' }),
		headers: {
			Authorization: process.env.PASSWORD as string,
			'Content-Type': 'application/json'
		}
	}).then((res) => res.json())) as { email: string; code: string };

	await fetch(`http://localhost:8080/users/${username}`, {
		method: 'PUT',
		body: JSON.stringify({
			dob: matchedUser.dob,
			email: matchedUser.email,
			name: matchedUser.name,
			password: matchedUser.password,
			resetRequested: true,
			resetCode: encrypt(code),
			username: matchedUser.username,
			verificationCode: matchedUser.verificationCode,
			verified: matchedUser.verified
		} as User),
		headers: {
			Authorization: process.env.TOKEN as string,
			'Content-Type': 'application/json'
		}
	});

	res.status(200).end('Success: Reset code sent in mail!');
});

router.post('/reset-pwd', async (req, res) => {
	const { username, email, code, password } = req.body as {
		username: string;
		email: string;
		code: string;
		password: string;
	};
	if (!username?.length || !code?.length || !password?.length || !email?.length) {
		return res.status(500).end('Error: Incomplete Details!');
	}

	const users: Array<User> = await getUsers();
	const matchedUser = users.find((u) => u.username === username);
	if (!matchedUser) {
		return res.status(501).end('Error: User does not exist!');
	}

	if (matchedUser.resetCode !== encrypt(code) || matchedUser.email !== email || !matchedUser.resetRequested) {
		return res.status(502).end('Error: Invalid credentials!');
	}

	await fetch(`http://localhost:8080/users/${username}`, {
		method: 'PUT',
		body: JSON.stringify({
			dob: matchedUser.dob,
			email: matchedUser.email,
			name: matchedUser.name,
			password: encrypt(password),
			resetCode: 'undefined',
			resetRequested: false,
			verificationCode: matchedUser.verificationCode,
			username: matchedUser.username,
			verified: matchedUser.verified
		} as User),
		headers: {
			Authorization: process.env.TOKEN as string,
			'Content-Type': 'application/json'
		}
	});

	return res.status(200).end('Success: Password reset successfully!');
});

router.post('/verify', async (req, res) => {
	const { code, username } = req.body as { username: string; email: string; code: string };

	if (!username?.length || !code?.length) {
		return res.status(500).end('Error: Incomplete Details!');
	}

	const users: Array<User> = await getUsers();

	const matchedUser = users.find((u) => u.username === username);
	if (!matchedUser) {
		return res.status(501).end('Error: User does not exist!');
	}

	if (matchedUser.verificationCode !== encrypt(code) || matchedUser.verified) {
		return res.status(502).end('Error: Invalid credentials!');
	}

	await fetch(`http://localhost:8080/users/${username}`, {
		method: 'PUT',
		body: JSON.stringify({
			dob: matchedUser.dob,
			email: matchedUser.email,
			name: matchedUser.name,
			password: matchedUser.password,
			resetCode: matchedUser.resetCode,
			resetRequested: matchedUser.resetRequested,
			verificationCode: 'undefined',
			username: matchedUser.username,
			verified: true
		} as User),
		headers: {
			Authorization: process.env.TOKEN as string,
			'Content-Type': 'application/json'
		}
	});

	return res.status(200).end('Success: Password reset successfully!');
});

router.post('/validate-login', async (req, res) => {
	const { token, username } = req.body as { username: string; token: string };
	if (!token?.length || !username?.length) {
		return res.status(500).end('Error: Incomplete Details!');
	}

	const users = await getUsers();
	const matchedUser = users.find((u) => u.username === username);
	if (!matchedUser) {
		return res.status(501).end('Error: User does not exist!');
	}

	if (token === encrypt(username)) {
		return res.status(200).json({
			id: matchedUser.id,
			name: matchedUser.name,
			username: matchedUser.username,
			email: matchedUser.email,
			dob: matchedUser.dob
		});
	}

	return res.status(502).end('Error: Invalid credentials!');
});

export default router;
