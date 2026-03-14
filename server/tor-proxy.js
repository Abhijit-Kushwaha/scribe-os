const express = require("express");
const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const cors = require("cors");

const app = express();
app.use(cors());

const TOR_PROXY = "socks5h://127.0.0.1:9050";
const agent = new SocksProxyAgent(TOR_PROXY);

app.get("/tor-fetch", async (req, res) => {
  try {
    const url = req.query.url;

    const response = await axios.get(url, {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 20000
    });

    res.send(response.data);
  } catch (err) {
    res.status(500).send("Tor request failed");
  }
});

app.listen(3001, () => {
  console.log("Tor proxy running on port 3001");
});