# Happy Cake application

An app that allows to order a birthday cake and deliver it to a recipient the next day!

The project was developed using:

-   **NodeJs** version **16.17.1**
-   **NPM** version **6.14.2**
-   **Docker** version **24.0.5**

## Launching the project

1. Clone the project GitHub
2. Create `images` directory in the root of the project
3. Create `.env` file in the root of the project and specify there these:

```
# Application envs
PORT=<numeric value; defaults to 3000>
SIZE_LIMIT=<numeric value in bites; defaults to 10485760 - 10 MB>

# Cakery API envs
RATE_LIMIT=<numeric value; defaults 60 (based on the API specification)>
AUTHORIZATION_KEY='bearer <key string>'
REQUEST_BODY_KEY='another key string'

# Database envs
MYSQL_PORT=<numeric value; typically 3306>
MYSQL_ROOT_PASSWORD='string value'
MYSQL_PASSWORD='string value'
MYSQL_USER=caker
```

### Using **Docker Compose**

4. Open a terminal in the project's root directory and use **Docker Compose** to run the application

    **NB!** The latest version of **Docker** includes **Docker Compose**

    4.1. Start the app in **development** mode (will allow to use the container for development purposes):

    ```
    docker compose -f docker-compose.yml up -d
    ```

    4.2. Start the app in **production** mode (will build the application and launch it):

    ```
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    ```

### Using standalone launch

**NB!** Make sure that you have a **MySQL** server up and running. Also make sure that it has `happycake` schema and `reservations` table. You can use the code from `mysql/schema.sql`. Also make sure that values in `.env` correspond to usernames and passwords of your local **MySQL** server instance.

4. Open a terminal in the project's root directory and execute:

    ```
    npm install
    ```

    4.1. Start the app in **development** mode:

    ```
    npm run dev
    ```

## Using the application

Application allows to:

-   check cakes availability;
-   place a birthday cake order;
-   see a list of orders to deliver to birthday people for the current day and specific city;
-   see a list of birthday people for the current day for marketing purposes;

### Check cakes availability:

Open an SSE channel to `/cake-stock` endpoint. It is crucial that that you attach `-H "Accept: text/event-stream"` headers to your request. Due to the "flaky" nature of the third-party API, the app is using a request limiting and queueing approach that prevents the usage of standard request-response methods. Instead, request client needs to open an SSE channel and the app will send the message payload once the third-party API responses.
cURL request example:

```bash
curl -H "accept: text/event-stream" http://localhost:3000/cake-stock
```

If all is good, your client will receive the following messages (use response.text):
First message:

```
{"status":"processing","message":"keep SSE open"}
```

Second message:

```
{"status":"success","message":[{"name":"Chocolate","quantity":4},{"name":"Red Velvet","quantity":6},{"name":"チーズケーキ","quantity":16}]}
```

If there was an issue, then the `status` will be `error` and the `message` will contain error messages.

In any result, once the client receives a message with `status` of either `success` or `error`, it must close the SSE channel, because no more messages come (if what, the app is configured to close the channel on the server side as well, after 3 secods)

### Make an order for a birthday cake:

SSE is also used for placing a cake order. However, due to the nature of how a client can open an SSE channel, the process consists of 2 steps:

1. Client makes a `POST` request to `/reserve` endpoint with a `form-data` body of the order reservation data (headers must be `Content-Type: multipart/form-data`):

```javascript
cake: string, // one of the valid cake names URL-encoded
name: string, // name of the recipient
birthday: string, // birthday of the recipient in yyyy-mm-dd format
address: string,
city: string, // either Helsinki, Espoo, or Vantaa
image: file, // optional image file
message: string, // optional text
youtube: url-string, // optional YouTube video url
twitter: url-string, // optional X (Twitter) post url
```

**NB!** `cake` should be URL-encoded if you want to order a cake with exotic characters. For example, there was a cake **チーズケーキ**. So, if you want to order that one, then attach its URL-encoded version -> `%E3%83%81%E3%83%BC%E3%82%BA%E3%82%B1%E3%83%BC%E3%82%AD`

**NB!** you can only make a reservation for a birthday that will happen tomorrow. For instance, if today is January 1st (**yyyy-01-01**), then you can make an order reservation only if the recipient's birthday is on January 2nd (**yyyy-01-02**)

2. If everything is OK, it will receive response with status `303` and redirection string. The client must then use the string to open SSE channel and listen for messages (same approach as with `/cake-stock`)
   If all is good, the `message` will contain order number.

### See a list of today's deliveries

Client needs to make a `GET` request to `/deliveries-today` endpoint with a query parameter of `city`, that can be either Helsinki, Espoo, or Vantaa. The app does not need to make a third-party request and retrieves the data from a database, that is why the client does not need to open an SSE channel.

### See a list of today's birthday people

Client needs to make a `GET` request to `/today-birthdays` endpoint. Again, the app does not need to make a third-party request and instead obtains data from the database.

## Q & A

### 1) Why SSE?

So, the app is actually obtaining the data about cakes and makes cake orders via a third-party API, that has a processing limit of 60 requests per second.
The app is using a request limiter logic with queuing of excessive requests.
But the client needs to get the response, that is when SSE becomes handy,
because with it the backend server, i.e. our application, can send multiple messages
to the client (processing of the request might be queued and take longer time).

### 2) Why not caching information about the available cakes from the `/cake-stock` endpoint?

Because the third-party API had an interesting feature of returning different quantity of cakes at every request

### 3) Is this solution scalable?

Vertically - YES,
Horizontally - NO

The app is using internal queue of requests and list of request clients.
So, giving more power to 1 app instance will work. However, if you want to
make the system scalable also horizontally, then the request queue and list of clients
must be extracted into separate services; good choices will be Apache Kafka, RabbitMQ and Redis.

### 4) Why can't I order a cake well in advance (more than 1 day)?

Well, indeed, this application is configured to accept only reservations for birthdays that will happen only the next day. The reason is again due to the behavior of the third-party API (it returns different cake quantities at every request). So, it can be concluded that when an order is placed, a cake is set aside to be delivered on the day of delivery. Now, imagine that the birthday is in 2 months, in such case the recipient will get a 2-months old cake - not the freshest cake for a party 😅

That is why the system was created in a way to let people can book a cake that is 1-day old max 👍

### 5) I don't want to use Docker Compose, but only Docker

Sure, here are the instructions:

To create a **development** image tagged `jobilla-dev`:

```
docker build --target dev -t jobilla-dev .
```

To run this `jobilla-dev` image with container name `jobilla-dev` (assuming you have a **Windows** device):

**Git Bash terminal**

```bash
docker run -p 3000:3000 -v /$PWD/src:/app/src -v /$PWD/images:/app/images --name jobilla-dev jobilla-dev npm run dev
```

**Windows CMD terminal**

```cmd
docker run -p 3000:3000 -v %cd%/src:/app/src -v %cd%/images:/app/images --name jobilla-dev jobilla-dev npm run dev
```

To create a **production** image tagged `jobilla-prod`:

```
docker build --target prod -t jobilla-prod .
```

To run this `jobilla-prod` image with container name `jobilla-prod`:

**Git Bash terminal**

```bash
docker run -p 3000:3000 -v /$PWD/images:/app/images --name jobilla-prod jobilla-prod npm run prod
```

**Windows CMD terminal**

```cmd
docker run -p 3000:3000 -v %cd%/images:/app/images --name jobilla-prod jobilla-prod npm run prod
```
