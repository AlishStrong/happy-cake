import express from 'express';
import 'express-async-errors';
import router from './routers/router';
import middleware from './utils/middleware';

const app = express();

app.disable('x-powered-by');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.use(middleware.errorHandler);

export default app;
