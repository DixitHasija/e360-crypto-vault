const axios = require('axios');

/**
 * Vercel Serverless Function
 * Proxies requests to the E360 Marketing API, forwarding required headers and body.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = req.headers['e360-crypto-x-api-key'];
    const secretKey = req.headers['e360-crypto-x-secret-key'];

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'Missing API keys' });
    }

    const upstreamResponse = await axios.post(
      'https://e360-marketing-api.shiprocket.in/encryption/perform-op',
      req.body,
      {
        headers: {
          'E360-CRYPTO-X-API-KEY': apiKey,
          'E360-CRYPTO-X-SECRET-KEY': secretKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Crypto-Vault-Proxy/1.0'
        },
        timeout: 30000
      }
    );

    return res.status(upstreamResponse.status).json(upstreamResponse.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Proxy server error', message: error.message });
  }
};


