FROM node:21-alpine
COPY package.*json src /app/
WORKDIR /app
EXPOSE 3000/tcp
RUN npm install
CMD["node", "app.js"]
