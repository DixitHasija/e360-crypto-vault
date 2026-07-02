const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Enable CORS for all origins (since this is our proxy server)
app.use(cors());
app.use(express.json());

// Proxy endpoint (support both with and without /api prefix for dev/prod parity)
app.post(['/encryption/perform-op', '/api/encryption/perform-op'], async (req, res) => {
  try {
    console.log('=== PROXY SERVER REQUEST ===');
    console.log('Headers received from React app:', req.headers);
    console.log('Body:', req.body);
    
    // Extract API keys from headers
    const apiKey = req.headers['e360-crypto-x-api-key'];
    const secretKey = req.headers['e360-crypto-x-secret-key'];
    
    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'Missing API keys' });
    }
    
    // Make the actual API call with clean headers
    const response = await axios.post('https://e360-marketing-api.shiprocket.in/encryption/perform-op', req.body, {
      headers: {
        'E360-CRYPTO-X-API-KEY': apiKey,
        'E360-CRYPTO-X-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Crypto-Vault-Proxy/1.0'
      }
    });
    
    console.log('=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('==================');
    
    // Return the response to the React app
    res.json(response.data);
    
  } catch (error) {
    console.error('=== PROXY ERROR ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy server error', message: error.message });
    }
    console.error('==================');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log('Ready to proxy requests to E360 API');
});
