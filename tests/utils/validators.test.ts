import { ReservationBody, ReservationBodyError } from '../../src/models/models';
import validators from '../../src/utils/validators';

const cur = new Date();
const curYear = cur.getFullYear();
const curMonth = cur.getMonth() + 1; // January is 0
const curDate = cur.getDate();

const today = new Date([curYear - 30, curMonth, curDate].join('-'));
const tomorrow = new Date([curYear - 25, curMonth, curDate + 1].join('-'));
const afterTomorrow = new Date([curYear - 20, curMonth, curDate + 2].join('-'));
const yesterday = new Date([curYear - 15, curMonth, curDate - 1].join('-'));
const nextMonth = new Date([curYear - 10, curMonth + 1, curDate].join('-'));
const previousMonth = new Date([curYear - 5, curMonth - 1, curDate].join('-'));
const nextYear = new Date([curYear + 1, curMonth, curDate].join('-'));

describe('velidators', () => {
    describe('isString', () => {
        test.each([
            { str: 'str', exp: true },
            { str: 123, exp: false },
            { str: null, exp: false },
            { str: undefined, exp: false },
            { str: {}, exp: false },
            { str: { str: 'str' }, exp: false }
        ])('should return $exp when input is $str', ({ str, exp }) => {
            const result = validators.isString(str);
            expect(result).toBe(exp);
        });

        it('should return true if input is an instance of String', () => {
            const input = new String('Hello, World!');
            const result = validators.isString(input);
            expect(result).toBe(true);
        });
    });

    describe('sanitizeString', () => {
        test.each([
            { input: 'str', exp: 'str' },
            { input: 'st&r', exp: 'str' },
            { input: "st'r", exp: 'str' },
            { input: 'st;r', exp: 'str' },
            { input: 'st<r>', exp: 'str' },
            { input: 'st"r', exp: 'str' },
            { input: 'st\\r', exp: 'str' }
        ])(
            'should return string without ; < > & \' " \\ characters',
            ({ input, exp }) => {
                const result = validators.sanitizeString(input);
                expect(result).toBe(exp);
            }
        );

        it('should return true if input is an instance of String', () => {
            const input = new String('Hello, World!');
            const result = validators.isString(input);
            expect(result).toBe(true);
        });
    });

    describe('isDate', () => {
        test.each([
            { input: '2022-01-01', expected: true },
            { input: '2022/01/01', expected: true },
            { input: 'Jan 1, 2022', expected: true },
            { input: 'Not a date', expected: false },
            { input: '2022-13-01', expected: false },
            { input: '2022-01-32', expected: false },
            { input: `${Date.now()}`, expected: false },
            { input: '{2022-01-01}', expected: false }
        ])(
            'should return $expected when input is $input',
            ({ input, expected }) => {
                const result = validators.isDate(input);
                expect(result).toBe(expected);
            }
        );
    });

    describe('isNextDay', () => {
        test.each([
            { input: today.toISOString(), expected: false },
            { input: tomorrow.toISOString(), expected: true },
            { input: afterTomorrow.toISOString(), expected: false },
            { input: yesterday.toISOString(), expected: false },
            { input: nextMonth.toISOString(), expected: false },
            { input: previousMonth.toISOString(), expected: false },
            { input: nextYear.toISOString(), expected: false }
        ])(
            'should return $expected when input is $input',
            ({ input, expected }) => {
                const result = validators.isNextDay(input);
                expect(result).toBe(expected);
            }
        );
    });

    describe('parseCake', () => {
        test.each([
            { cake: 'Chocolate', expected: 'Chocolate' },
            { cake: 'チーズケーキ', expected: 'チーズケーキ' },
            { cake: encodeURI('チーズケーキ'), expected: 'チーズケーキ' },
            { cake: ' Trimmed ', expected: 'Trimmed' },
            {
                cake: ' &Tab;javascript:alert(321)',
                expected: 'Tabjavascript:alert(321)'
            },
            { cake: '', expected: 'error' },
            { cake: '   ', expected: 'error' },
            { cake: null, expected: 'error' },
            { cake: undefined, expected: 'error' },
            { cake: 123, expected: 'error' },
            { cake: false, expected: 'error' },
            { cake: { type: 'Vanilla' }, expected: 'error' }
        ])(
            'should return $expected when cake is $cake',
            ({ cake, expected }) => {
                try {
                    const result = validators.parseCake(cake);
                    expect(result).toBe(expected);
                } catch (error: unknown) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe(
                        'Incorrect or missing cake type'
                    );
                }
            }
        );
    });

    describe('parseName', () => {
        test.each([
            { name: 'Jake', expected: 'Jake' },
            { name: ' Trimmed ', expected: 'Trimmed' },
            {
                name: ' &Tab;javascript:alert(321)',
                expected: 'Tabjavascript:alert(321)'
            },
            { name: '', expected: 'error' },
            { name: '   ', expected: 'error' },
            { name: null, expected: 'error' },
            { name: undefined, expected: 'error' },
            { name: 123, expected: 'error' },
            { name: false, expected: 'error' },
            { name: { type: 'Vanilla' }, expected: 'error' }
        ])(
            'should return $expected when name is $name',
            ({ name, expected }) => {
                try {
                    const result = validators.parseName(name);
                    expect(result).toBe(expected);
                } catch (error: unknown) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe(
                        "Incorrect or missing recipient's name"
                    );
                }
            }
        );
    });

    describe('parseBirthday', () => {
        describe('should return date', () => {
            test.each([
                {
                    birthday: tomorrow.toISOString(),
                    expected: tomorrow.toISOString().substring(0, 10)
                }
            ])('when birthday is $birthday', ({ birthday, expected }) => {
                expect(validators.parseBirthday(birthday)).toEqual(expected);
            });
        });

        describe('should throw error', () => {
            describe('for incorrect or missing birthday date', () => {
                test.each([
                    [
                        { input: null },
                        { input: undefined },
                        { input: '' },
                        { input: '  ' },
                        { input: 123 },
                        { input: {} },
                        { input: true },
                        { input: false },
                        { input: 'Not a date' },
                        { input: '2022-13-01' },
                        { input: '2022-01-32' },
                        { input: `${Date.now()}` },
                        { input: '{2022-01-01}' }
                    ]
                ])('', ({ input }) => {
                    expect(() => validators.parseBirthday(input)).toThrow(
                        ReservationBodyError.BIRTHDAY_DATE
                    );
                });
            });
            describe("'Cake can be reserved 1 day before the birthday!' for cake reservation with correct date but not on next day", () => {
                test.each([
                    {
                        birthday: afterTomorrow.toISOString(),
                        reason: 'is day after tomorrow'
                    },
                    {
                        birthday: yesterday.toISOString(),
                        reason: 'was yesterday'
                    },
                    {
                        birthday: nextMonth.toISOString(),
                        reason: 'is next month'
                    },
                    {
                        birthday: previousMonth.toISOString(),
                        reason: 'was last month'
                    }
                ])('because birthday $reason', ({ birthday }) => {
                    expect(() => validators.parseBirthday(birthday)).toThrow(
                        ReservationBodyError.BIRTHDAY
                    );
                });
            });
        });
    });

    describe('parseAddress', () => {
        test.each([
            {
                address: 'Some street, some apartment',
                expected: 'Some street, some apartment'
            },
            { address: ' trimmed address ', expected: 'trimmed address' },
            {
                address: ' &Tab;javascript:alert(321)',
                expected: 'Tabjavascript:alert(321)'
            },
            { address: '', expected: 'error' },
            { address: null, expected: 'error' },
            { address: undefined, expected: 'error' },
            { address: 123, expected: 'error' },
            { address: {}, expected: 'error' },
            { address: today, expected: 'error' },
            { address: true, expected: 'error' }
        ])(
            'should return $expected when address is $address',
            ({ address, expected }) => {
                try {
                    const result = validators.parseAddress(address);
                    expect(result).toBe(expected);
                } catch (error: unknown) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe(
                        "Incorrect or missing recipient's address"
                    );
                }
            }
        );
    });

    describe('parseCity', () => {
        test.each([
            { city: 'Helsinki', expected: 'helsinki' },
            { city: 'helsinki', expected: 'helsinki' },
            { city: ' helsinki ', expected: 'helsinki' },
            { city: 'Espoo', expected: 'espoo' },
            { city: 'ESPOO', expected: 'espoo' },
            { city: 'Vantaa', expected: 'vantaa' },
            { city: 'vantAA', expected: 'vantaa' }
        ])(
            'should return $expected when city is $city',
            ({ city, expected }) => {
                expect(validators.parseCity(city)).toEqual(expected);
            }
        );

        describe('should throw error', () => {
            test.each([
                {
                    city: 'Tampere',
                    error: ReservationBodyError.CITY_NAME
                },
                {
                    city: ' turku ',
                    error: ReservationBodyError.CITY_NAME
                },
                {
                    city: 'OULU ',
                    error: ReservationBodyError.CITY_NAME
                },
                {
                    city: null,
                    error: ReservationBodyError.CITY
                },
                {
                    city: undefined,
                    error: ReservationBodyError.CITY
                },
                {
                    city: '',
                    error: ReservationBodyError.CITY
                },
                {
                    city: '  ',
                    error: ReservationBodyError.CITY
                },
                {
                    city: 123,
                    error: ReservationBodyError.CITY
                },
                {
                    city: today,
                    error: ReservationBodyError.CITY
                },
                {
                    city: {},
                    error: ReservationBodyError.CITY
                },
                {
                    city: true,
                    error: ReservationBodyError.CITY
                }
            ])("$error when city is '$city'", ({ city, error }) => {
                expect(() => validators.parseCity(city)).toThrow(error);
            });
        });
    });

    describe('parseMessage', () => {
        test.each([
            { message: '<script>', expected: 'script' },
            { message: ' hel&inki ', expected: 'helinki' }
        ])(
            'should return $expected when message is $message',
            ({ message, expected }) => {
                expect(validators.parseMessage(message)).toEqual(expected);
            }
        );

        describe('should throw error', () => {
            test.each([
                {
                    message: null,
                    error: ReservationBodyError.MESSAGE
                },
                {
                    message: undefined,
                    error: ReservationBodyError.MESSAGE
                },
                {
                    message: true,
                    error: ReservationBodyError.MESSAGE
                },
                {
                    message: false,
                    error: ReservationBodyError.MESSAGE
                },
                {
                    message: {},
                    error: ReservationBodyError.MESSAGE
                },
                {
                    message: today,
                    error: ReservationBodyError.MESSAGE
                }
            ])("$error when message is '$message'", ({ message, error }) => {
                expect(() => validators.parseMessage(message)).toThrow(error);
            });
        });
    });

    describe('parseBodyFields', () => {
        test('should create ReservationBody without message', () => {
            const body = {
                cake: 'cake',
                name: 'John',
                birthday: tomorrow.toISOString(),
                address: 'some address',
                city: 'Helsinki'
            };
            const reservationBody = {} as ReservationBody;
            const errorMessages: string[] = [];

            validators.parseBodyFields(body, reservationBody, errorMessages);

            expect(errorMessages.length).toBe(0);

            expect(reservationBody.cake).toBe('cake');
            expect(reservationBody.name).toBe('John');
            expect(reservationBody.birthday).toBe(
                tomorrow.toISOString().substring(0, 10)
            );
            expect(reservationBody.address).toBe('some address');
            expect(reservationBody.city).toBe('helsinki');
        });

        test('should create ReservationBody with message, YouTube video and X (Twitter) message', () => {
            const body = {
                cake: 'cake',
                name: 'John',
                birthday: tomorrow.toISOString(),
                address: 'some address',
                city: 'Helsinki',
                message: 'Happy birthday!',
                youtube:
                    'https://www.youtube.com/embed/X7mdC67zff4?si=JSMKrRItffvWN2Yd',
                twitter:
                    'https://x.com/realDonaldTrump/status/1347569870578266115?s=20'
            };
            const reservationBody = {} as ReservationBody;
            const errorMessages: string[] = [];

            validators.parseBodyFields(body, reservationBody, errorMessages);

            expect(errorMessages.length).toBe(0);

            expect(reservationBody.cake).toBe('cake');
            expect(reservationBody.name).toBe('John');
            expect(reservationBody.birthday).toBe(
                tomorrow.toISOString().substring(0, 10)
            );
            expect(reservationBody.address).toBe('some address');
            expect(reservationBody.city).toBe('helsinki');
            expect(reservationBody.message).toBe('Happy birthday!');
            expect(reservationBody.youtube).toBe(
                'https://www.youtube.com/embed/X7mdC67zff4?si=JSMKrRItffvWN2Yd'
            );
            expect(reservationBody.twitter).toBe(
                'https://x.com/realDonaldTrump/status/1347569870578266115?s=20'
            );
        });

        describe('should indicate missing fields', () => {
            test('all', () => {
                const body = {};
                const reservationBody = {} as ReservationBody;
                const errorMessages: string[] = [];

                validators.parseBodyFields(
                    body,
                    reservationBody,
                    errorMessages
                );

                expect(errorMessages.length).toBeGreaterThan(0);
                expect(
                    errorMessages.includes('cake field is missing')
                ).toBeTruthy();
                expect(
                    errorMessages.includes('name field is missing')
                ).toBeTruthy();
                expect(
                    errorMessages.includes('birthday field is missing')
                ).toBeTruthy();
                expect(
                    errorMessages.includes('address field is missing')
                ).toBeTruthy();
                expect(
                    errorMessages.includes('city field is missing')
                ).toBeTruthy();
            });

            test('some: address and city', () => {
                const body = {
                    cake: 'cake',
                    name: 'John',
                    birthday: tomorrow.toISOString()
                };
                const reservationBody = {} as ReservationBody;
                const errorMessages: string[] = [];

                validators.parseBodyFields(
                    body,
                    reservationBody,
                    errorMessages
                );

                expect(errorMessages.length).toBeGreaterThan(0);
                expect(
                    errorMessages.includes('address field is missing')
                ).toBeTruthy();
                expect(
                    errorMessages.includes('city field is missing')
                ).toBeTruthy();
            });
        });

        test('should indicate YouTube video and X (Twitter) message are invalid', () => {
            const body = {
                cake: 'cake',
                name: 'John',
                birthday: tomorrow.toISOString(),
                address: 'some address',
                city: 'Helsinki',
                message: 'Happy birthday!',
                youtube:
                    'https://www.rutube.com/X7mdC67zff4?si=JSMKrRItffvWN2Yd',
                twitter:
                    'https://threads.com/fakeDonaldTrump/status/1347569870578266115?s=20'
            };
            const reservationBody = {} as ReservationBody;
            const errorMessages: string[] = [];

            validators.parseBodyFields(body, reservationBody, errorMessages);

            expect(errorMessages.length).toBeGreaterThan(0);

            expect(
                errorMessages.includes(ReservationBodyError.YOUTUBE)
            ).toBeTruthy();
            expect(
                errorMessages.includes(ReservationBodyError.X_TWITTER)
            ).toBeTruthy();
        });
    });

    describe('toReservationBody', () => {
        test('should return ReservationBody', () => {
            const body = {
                cake: 'cake',
                name: 'John',
                birthday: tomorrow.toISOString(),
                address: 'some address',
                city: 'Helsinki'
            };

            const reservationBody = validators.toReservationBody(body);

            expect(reservationBody.cake).toBe('cake');
            expect(reservationBody.name).toBe('John');
            expect(reservationBody.birthday).toBe(
                tomorrow.toISOString().substring(0, 10)
            );
            expect(reservationBody.address).toBe('some address');
            expect(reservationBody.city).toBe('helsinki');
        });

        test.each([null, undefined, true, false, 123, '', '  ', 'abc'])(
            'should throw error if body is not an object but %s',
            (body) => {
                expect(() => validators.toReservationBody(body)).toThrow(
                    ReservationBodyError.NO_DATA
                );
            }
        );

        describe('should throw error in JSON string about', () => {
            test('missing fields', () => {
                expect(() => validators.toReservationBody({})).toThrow(
                    '["cake field is missing","name field is missing","birthday field is missing","address field is missing","city field is missing"]'
                );
            });

            test('incorrect data', () => {
                const incorrectBody = {
                    cake: 407,
                    name: '  ',
                    birthday: nextMonth.toISOString(),
                    address: {},
                    city: 'Tampere',
                    message: [' wrong']
                };

                expect(() =>
                    validators.toReservationBody(incorrectBody)
                ).toThrow(
                    JSON.stringify([
                        ReservationBodyError.CAKE,
                        ReservationBodyError.NAME,
                        ReservationBodyError.BIRTHDAY,
                        ReservationBodyError.ADDRESS,
                        ReservationBodyError.CITY_NAME,
                        ReservationBodyError.MESSAGE
                    ])
                );
            });

            test('missing fields and incorrect data', () => {
                const incorrectBody = {
                    birthday: nextMonth.toISOString(),
                    address: {},
                    city: 'Tampere',
                    message: [' wrong']
                };

                expect(() =>
                    validators.toReservationBody(incorrectBody)
                ).toThrow(
                    JSON.stringify([
                        'cake field is missing',
                        'name field is missing',
                        ReservationBodyError.BIRTHDAY,
                        ReservationBodyError.ADDRESS,
                        ReservationBodyError.CITY_NAME,
                        ReservationBodyError.MESSAGE
                    ])
                );
            });
        });
    });
});
