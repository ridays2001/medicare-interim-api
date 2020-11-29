import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import logger from 'morgan';

import AuthRouter from './routers/auth';
import EtcRouter from './routers/etc';

import express from 'express';
const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_, res) => res.end('Hello World!'));
app.use('/auth', AuthRouter);
app.use('/etc', EtcRouter);

const port = Number(process.env.PORT as string) || 80;
app.listen(port, () => console.log(`Listening on http://localhost${port === 80 ? '' : port}/`));
