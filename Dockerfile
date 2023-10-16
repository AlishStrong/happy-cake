FROM node:16.17.1-alpine3.15 as dev
LABEL author="Alisher Aliev"

WORKDIR /app
RUN ["mkdir", "-p", "images"]

RUN adduser -D -h /home/noder -s /bin/bash noder && \
    chown -R noder:noder /app
USER noder

COPY --chown=noder:noder package.json package-lock.json ./
RUN npm install

COPY --chown=noder:noder . .

VOLUME [ "/app/src", "/app/images" ]
EXPOSE 3000

FROM dev as prod
RUN ["npm", "run", "build"]
