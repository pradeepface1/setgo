# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN echo "VITE_API_URL=https://backend-191882634358.asia-south1.run.app" > .env
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
