import express from 'express';
import router from './routers/router';
import middleware from './utils/middleware';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.use(middleware.errorHandler);

export default app;
