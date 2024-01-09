require('dotenv').config();
const pingTimeoutSec = 90;
const port = process.env.PORT || 4308; // Slava Ukraina
const API_URL = process.env.API_URL;
const hostname = process.env.HOSTNAME;
const path = require('path');
const axios = require('axios');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.sendStatus(404);
});

app.get('/documents/:client_id', async (req, res) => {
  try {
    let client_id = getClientId(req);
    let params = buildAPIParams("robot", client_id, req);
    let response = await axios.get(API_URL, { params: params });
    res.sendStatus(200);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
});

app.get('/download/:client_id', async (req, res) => {
  try {
    let client_id = getClientId(req);
    let params = buildAPIParams("download", client_id, req);
    let response = await axios.get(API_URL, {
      responseType: 'arraybuffer',
      params: params,
    });
    let data = response.data;
    res.writeHead(200, {
      'Content-Type': response.headers['content-type'],
      'Content-disposition': response.headers['content-disposition'],
      'Content-Length': data.length,
    });
    res.end(Buffer.from(data, 'binary'));
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
});

app.get('/view/:client_id', async (req, res) => {
  try {
    let product = "";
    let client_id = getClientId(req);
    if (client_id.length > 16) {
      product = client_id.substr(16);
      client_id = client_id.substr(0, 16);
    }
    let params = buildAPIParams("install", client_id, req);
    params.client_avp = product;
    let response = await axios.get(API_URL, { params: params, });
    res.redirect(response.data);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  ping();
  setInterval(ping, pingTimeoutSec * 1000);
});

function ping() {
  let params = { "event": "ping", "server": hostname };
  axios.get(API_URL, { params: params }).catch((e) => {
    console.log(e.message);
  });
}

function getClientId(req) {
  let client_id = req.params.client_id;
  if (!client_id) {
    throw new Error("identificación");
  }
  client_id = "" + client_id;
  return client_id;
}

function buildAPIParams(evt, client_id, req) {
  return {
    event: evt,
    client_id: client_id,
    client_ip: getClientIp(req),
    client_ua: req.get('User-Agent'),
    referer: req.get('Referer'),
  };
}

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for']; // heroku
  if (ip && ip.length > 0) {
    ip = ip.split(',').pop().toString();
    if (ip) {
      return ip.trim();
    }
  }
  return req.socket.remoteAddress;
}
