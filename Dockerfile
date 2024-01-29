# Stage 1: Build Stage
FROM node:21-alpine as build

# Copy package.json and package-lock.json to the build directory
COPY package.json package-lock.json src /app/

# Set working directory
WORKDIR /app

# Install dependencies
RUN npm install


# Stage 2: Production Stage
FROM node:21-alpine as production

# Copy only necessary files from the build stage
COPY --from=build /app /app

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000/tcp

# Command to run the application
CMD ["node", "app.js"]

