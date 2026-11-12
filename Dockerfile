FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /Analogue-IT

# Copy package files first to leverage Docker's build cache
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your existing project files
COPY . .

# Expose the port your app listens on (e.g., 3000)
EXPOSE 3000

# Define the command to start your application
CMD ["npm", "run", "dev"]