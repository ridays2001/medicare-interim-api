export type User = {
	id?: number;
	name: string;
	email: string;
	username: string;
	dob: Date | string;
	password: string;
	verified: boolean;
	verificationCode: string;
	resetRequested: boolean;
	resetCode: string;
};
