# Use the official Microsoft Playwright image which includes Node.js and browsers
FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install the exact browser binary matching your installed playwright package
RUN npx playwright install chromium

# Copy the rest of the project
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port Render assigns
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]
