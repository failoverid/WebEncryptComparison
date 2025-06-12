# Dockerfile for Symmetric Encryption Performance Comparator

# Use the official Node.js LTS image
FROM node:20

# Set NODE_ENV for production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app


# Copy package.json and package-lock.json
COPY package*.json ./


# Install dependencies (production only)
RUN npm install --production


# Copy the rest of the application
COPY . .


# Build the Next.js app
RUN npm run build


# Expose port 3000
EXPOSE 3000


# Use a non-root user for security (node user is built-in)
USER node

# Start the Next.js app
CMD ["npm", "start"]
