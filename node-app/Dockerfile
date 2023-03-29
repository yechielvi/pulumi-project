FROM node:19-alpine3.15

COPY package.json .

RUN npm install

COPY app.js .

CMD [ "node", "app.js" ]