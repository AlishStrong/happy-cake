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
