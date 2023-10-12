import supertest from 'supertest';
import app from '../../src/app';
import { ReservationBodyError } from '../../src/models/models';
import * as uuid from 'uuid';
import axios from 'axios';
jest.mock('uuid');
jest.mock('axios');

const apiApp = supertest(app);

const cur = new Date();
const curYear = cur.getFullYear();
const curMonth = cur.getMonth() + 1; // January is 0
const curDate = cur.getDate();

const tomorrow = new Date([curYear - 25, curMonth, curDate + 1].join('-'));

describe('router API tests', () => {
    describe('/cake-stock', () => {
        const url = '/cake-stock';

        test('should succeed', async () => {
            jest.spyOn(uuid, 'v4').mockReturnValue('123456789');
            jest.spyOn(axios, 'get').mockReturnValue(
                new Promise((res, _rej) => {
                    res({
                        status: 200,
                        data: {
                            data: [
                                { name: 'cake 1', quantity: 1 },
                                { name: 'cake 2', quantity: 2 }
                            ]
                        }
                    });
                })
            );

            const response = await apiApp
                .get(url)
                .set('Accept', 'text/event-stream')
                .expect(200);

            expect(
                response.text.includes(
                    '{"status":"processing","message":"keep SSE open"}'
                )
            ).toBeTruthy();
            expect(response.text.includes('"status":"success"')).toBeTruthy();
            expect(response.text.includes('cake 1')).toBeTruthy();
            expect(response.text.includes('cake 2')).toBeTruthy();
        });

        test('should send 400 and error message', async () => {
            const response = await apiApp.get(url).expect(400);
            const errorResponse = response.body as { errors: string[] };
            expect(errorResponse.errors).toContain('Missing request headers');
        });
    });

    describe('/reserve', () => {
        describe('should succeed', () => {
            test('and return order ID', async () => {
                const url = '/reserve';
                const body = {
                    cake: 'cake',
                    name: 'John',
                    birthday: tomorrow.toISOString(),
                    address: 'some address',
                    city: 'Helsinki'
                };

                jest.spyOn(uuid, 'v4').mockReturnValue('123456789');
                jest.spyOn(axios, 'post').mockReturnValue(
                    new Promise((res, _rej) => {
                        res({
                            status: 200,
                            data: { data: { order_id: '987654321' } }
                        });
                    })
                );

                const response = await apiApp.post(url).send(body).expect(303);

                expect(response.headers.location as string).toBe(
                    '/reserve/123456789'
                );

                const finalResponse = await apiApp
                    .get('/reserve/123456789')
                    .set('Accept', 'text/event-stream')
                    .expect(200);

                expect(
                    finalResponse.text.includes(
                        '{"status":"processing","message":"keep SSE open"}'
                    )
                ).toBeTruthy();
                expect(
                    finalResponse.text.includes(
                        '{"status":"success","message":"987654321"}'
                    )
                ).toBeTruthy();
            });

            test('and prevent double processing', async () => {
                const url = '/reserve';
                const body = {
                    cake: 'cake',
                    name: 'John',
                    birthday: tomorrow.toISOString(),
                    address: 'some address',
                    city: 'Helsinki'
                };

                jest.spyOn(uuid, 'v4').mockReturnValue('123456789');
                jest.spyOn(axios, 'post').mockReturnValue(
                    new Promise((res, _rej) => {
                        setTimeout(() => {
                            res({
                                status: 200,
                                data: { data: { order_id: '987654321' } }
                            });
                        }, 100);
                    })
                );

                const response = await apiApp.post(url).send(body).expect(303);

                expect(response.headers.location as string).toBe(
                    '/reserve/123456789'
                );

                const firstResponsePromise = apiApp
                    .get('/reserve/123456789')
                    .set('Accept', 'text/event-stream')
                    .expect(200)
                    .expect((res) => {
                        expect(
                            res.text.includes(
                                '{"status":"processing","message":"keep SSE open"}'
                            )
                        ).toBeTruthy();
                        expect(
                            res.text.includes(
                                '{"status":"success","message":"987654321"}'
                            )
                        ).toBeTruthy();
                    });

                const secondResponsePromise = new Promise((res, _rej) => {
                    setTimeout(() => res(''), 10);
                }).then((_) => {
                    return apiApp
                        .get('/reserve/123456789')
                        .set('Accept', 'text/event-stream')
                        .expect(400)
                        .expect((res) => {
                            expect(
                                res.text.includes(
                                    '{"errors":["Request is already under processing"]}'
                                )
                            ).toBeTruthy();
                        });
                });

                await Promise.all([
                    firstResponsePromise,
                    secondResponsePromise
                ]);
            });
        });

        describe('should send 400 and error message', () => {
            test(`${ReservationBodyError.CITY_NAME}`, async () => {
                const url = '/reserve';
                const body = {
                    cake: 'cake',
                    name: 'John',
                    birthday: tomorrow.toISOString(),
                    address: 'some address',
                    city: 'Tampere'
                };

                const response = await apiApp.post(url).send(body).expect(400);
                const errorResponse = response.body as { errors: string[] };
                expect(errorResponse.errors).toContain(
                    ReservationBodyError.CITY_NAME
                );
            });

            test('missing fields', async () => {
                const url = '/reserve';
                const body = {
                    birthday: tomorrow.toISOString(),
                    address: 'some address',
                    city: 'Espoo'
                };

                const response = await apiApp.post(url).send(body).expect(400);
                const errorResponse = response.body as { errors: string[] };
                expect(errorResponse.errors).toContain('cake field is missing');
                expect(errorResponse.errors).toContain('name field is missing');
            });

            test('missing request headers', async () => {
                const url = '/reserve/1';
                const response = await apiApp.get(url).expect(400);
                const errorResponse = response.body as { errors: string[] };
                expect(errorResponse.errors).toContain(
                    'Missing request headers'
                );
            });

            test('unknown client request', async () => {
                const url = '/reserve/wrong-client-id';
                const response = await apiApp
                    .get(url)
                    .set('Accept', 'text/event-stream')
                    .expect(400);
                const errorResponse = response.body as { errors: string[] };
                expect(errorResponse.errors).toContain(
                    'Unknown client request'
                );
            });
        });
    });
});
