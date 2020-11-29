import crypto from 'crypto';

export const encrypt = (str: string) => {
	const salt = process.env.SALT as string;
	return crypto
		.createHmac('sha256', process.env.TOKEN as string)
		.update(`${salt}${str}`)
		.digest('base64');
};
