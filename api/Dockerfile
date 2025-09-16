FROM node:20-alpine

WORKDIR /api

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]