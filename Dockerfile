FROM node:20-slim AS builder

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Create app directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy build files from builder stage
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY theme.json ./
COPY .env* ./

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]