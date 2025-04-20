FROM node:20-alpine as backend
WORKDIR /app
COPY ../package*.json ./
RUN npm ci
COPY 