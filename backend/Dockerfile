FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port (Cloud Run uses 8080 by default, but we'll map it)
EXPOSE 8080

# Start command
CMD ["npm", "start"]
