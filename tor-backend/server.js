const express = require('express');
const cors = require('cors');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const TOR_PROXY = 'socks5://127.0.0.1:9050';
const agent = new SocksProxyAgent(TOR_PROXY);

let currentCircuit = [
  { ip: '185.220.101.1', country: 'Germany', flag: '🇩🇪' },
  { ip: '192.42.116.41', country: 'Netherlands', flag: '🇳🇱' },
  { ip: '104.244.76.13', country: 'USA', flag: '🇺🇸' }
];

let currentIP = '104.244.76.13';

app.get('/tor-fetch', async (req, res) => {
  const url = req.query.url;
  try {
    const response = await fetch(url, { agent });
    const html = await response.text();
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching through Tor: ' + error.message);
  }
});

app.post('/rotate-ip', (req, res) => {
  currentCircuit = [
    { ip: '77.247.181.162', country: 'Romania', flag: '🇷🇴' },
    { ip: '89.234.157.254', country: 'Sweden', flag: '🇸🇪' },
    { ip: '198.96.155.3', country: 'Canada', flag: '🇨🇦' }
  ];
  currentIP = '198.96.155.3';
  res.json({ success: true, newIP: currentIP });
});

app.get('/circuit', (req, res) => {
  res.json({ circuit: currentCircuit, currentIP });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tor proxy backend running on port ${PORT}`);
});
