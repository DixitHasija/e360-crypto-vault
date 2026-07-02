# PII Handler

A simple React application for performing encryption/decryption operations using the E360 Marketing API.

## Features

- Clean and modern user interface
- Form validation for all required fields
- Support for multiple operations (encrypt, decrypt, hash)
- Real-time API response display
- Error handling with user-friendly messages
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Usage

1. Fill in all the required fields:
   - **API Key**: Your E360 API key
   - **Secret Key**: Your E360 secret key
   - **Operation**: Select the operation you want to perform (encrypt, decrypt, or hash)
   - **Value**: The data you want to process
   - **Key Alternative Name**: The key alternative name for the operation

2. Click "Submit" to send the request to the API

3. The response will be displayed below the form, or an error message if something goes wrong

4. Use "Reset" to clear all fields and start over

## API Endpoint

The application makes requests to:
```
POST https://e360-marketing-api.shiprocket.in/encryption/perform-op
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Built With

- React 18
- Create React App
- Modern CSS with Flexbox and Grid
- Fetch API for HTTP requests

## Deploying to Vercel

This project includes a serverless API route at `api/encryption/perform-op.js` that proxies requests to the E360 Marketing API. In development, the app uses the local proxy at `http://localhost:3001`. In production (Vercel), it calls the serverless function at `/api/encryption/perform-op`.

Steps:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a new Vercel project and link this repo/folder. The default settings work:
   - Framework preset: Create React App
   - Build command: `npm run build`
   - Output directory: `build`
3. Deploy. After deploy, the app will call `https://<your-vercel-domain>/api/encryption/perform-op`.

Notes:
- API keys are provided at request time via headers in the UI; no environment variables are required on Vercel.
- For local development with the proxy server, run:
  ```bash
  npm run proxy
  npm start
  ```
