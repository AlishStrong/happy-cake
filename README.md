The project was developed using:

-   **NodeJs** version **16.17.1**
-   **NPM** version **6.14.2**
-   **Docker** version **24.0.5**

# Launch the project

1. Run `npm install` in the root of the project;
2. create file `.env` in the root of the project and specify there the following variables:

```
PORT=<port number for server>
AUTHORIZATION_KEY=<authorization header key in bearer format, e.g. 'bearer someSecretKey'>
REQUEST_BODY_KEY=<secret key string for body of requests to the Cakery API>
```

3. Run `npm run dev` and navigate to the localhost:<PORT> in a browser

============================

Based on the description of the assignment:

"Do you know the pain of having to deliver a cake to someone in the dead of the morning?"

"Simply tell us your loved one's name, birthday and address, pick a cake, and we'll get it straight to their doorstep first thing **in the morning**!"

And because subsequent requests to your `https://api.cakery.dev/cakes` returns different quantities for cakes,

It is assumed that a final customer of the system can only place order 1 day before the delivery the earliest!
If the current date is 7.10.2023 and the birthday is 1.11.1991, order placement request will be rejected, but if the birthday was 8.10.1991, then the order will be placed.

In order to order a Japanese cake to /orders of Cakery API,
The 'cake' value inside body of my /reserve body must be URL encoded. E.g.:

=============================
Cakery API allows to reserve cakes endlessly: if there were 5 cakes and 7 orders were made, all succeed and the result stock will show -2
=============================

Instead of:

curl -w " %{http_code}" -X POST \
 -H "Content-Type: application/json; charset=utf-8" \
 -d '{
"cake": "チーズケーキ",
"name": "Alisher",
"birthday": "1992-10-11T12:07:00.782Z",
"address": "street 5, apartment 3",
"city": "Helsinki",
"message": "Happy birthday!"
}' \
 http://localhost:3000/reserve

IT SHOULD BE:

curl -w " %{http_code}" -X POST \
 -H "Content-Type: application/json; charset=utf-8" \
 -d '{
"cake": "%E3%83%81%E3%83%BC%E3%82%BA%E3%82%B1%E3%83%BC%E3%82%AD",
"name": "Alisher",
"birthday": "1992-10-11T12:07:00.782Z",
"address": "street 5, apartment 3",
"city": "Helsinki",
"message": "Happy birthday!"
}' \
 http://localhost:3000/reserve

"%E3%83%81%E3%83%BC%E3%82%BA%E3%82%B1%E3%83%BC%E3%82%AD" was obtained through

encodeURI("チーズケーキ")

THEN in the axios post request to Cakery API /orders the encoded name must be decoded!

```
const decodedJapaneseCake = decodeURI("%E3%83%81%E3%83%BC%E3%82%BA%E3%82%B1%E3%83%BC%E3%82%AD");
const postBody = {
                key: 'key',
                cake: decodedJapaneseCake
            }
```

curl \
 -H "Content-Type: application/json" \
 -H "Accept: text/event-stream" \
 -d '{
"cake": "%E3%83%81%E3%83%BC%E3%82%BA%E3%82%B1%E3%83%BC%E3%82%AD",
"name": "Alisher",
"birthday": "1992-10-12T12:07:00.782Z",
"address": "street 5, apartment 3",
"city": "Helsinki",
"message": "Happy birthday!"
}' \
 http://localhost:3000/reserve
