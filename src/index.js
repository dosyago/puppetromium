import os from 'os';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import {randomFillSync} from 'crypto';
import {fileURLToPath} from 'url';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import puppeteer from 'puppeteer';
import mjpegServer from 'mjpeg-server';

const SHOT_OPTS = {
  type: 'jpeg',
  quality: 75,
};
const DEBUG = true;
const START_URL = 'https://jspaint.app/';
//const START_URL = 'https://www.github.com/i5ik/puppetromium';
const SHOT_DELAY = 750;
const CLICK_DELAY = 150;
const TYPE_DELAY = 300;
const sleep = ms => new Promise(res => setTimeout(res, ms));
const getIP = req => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

const CLI = fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if ( CLI ) {
  const PORT = parseInt(process.argv[2]);
  if ( Number.isNaN(PORT) ) {
    throw new TypeError(`Supply port as first argument.`);
  }

  start(PORT);
}

export async function start(port, {url: url = START_URL} = {}) {
  const state = {
    shooting: false,
    latestShot: null,
    clients: []
  };
  process.stdout.write(`Starting browser...`);
  const bro = await puppeteer.launch({
    headless: true
  });
  const page = await bro.newPage();
  await page.goto(url);
  await broadcastShot();
  console.log(`Started browser.`);

  process.stdout.write(`Starting server...`);
  const app = express();
  //app.use(helmet());
  app.use(express.urlencoded({extended: true}));
  app.use(cookieParser());

  app.get('/', (req, res) => {
    res.end(BrowserView())
  });

  app.get('/input_overlay.html', (req, res) => {
    res.type('html');
    res.end(InputOverlay());
  });

  app.get('/viewport.mjpeg', async (req, res, next) => {
    const mjpeg = mjpegServer.createReqHandler(req, res);
    state.clients.push({
      mjpeg, ip: getIP(req)
    });
    // i don't know why 3 frames are needed
    await broadcastShot();
    await broadcastShot();
    await broadcastShot();
    console.log(`1 new client. Total clients: ${state.clients.length}`);
    next();
  });

  app.post('/carpediem', async (req, res) => {
    let {'viewport.x':x,['viewport.y']:y,text} = req.body; 
    let action;

    x = parseFloat(x);
    y = parseFloat(y);
    if ( Number.isFinite(x) && Number.isFinite(y) ) {
      action = {
        type: 'click',
        x, y
      };
    } else if ( typeof text === "string" ) {
      action = {
        type: 'typing',
        text
      };
    }

    DEBUG && console.log({x,y,text,action}, req.body);

    if ( action ) {
      await sendAction(action);
    }

    res.type('html');
    res.end(InputOverlay());
  });

  app.listen(port, err => {
    if ( err ) {
      console.warn(`Error on server start, port: ${port}`, err);
      throw err;
    }
    console.log({
      serverUp: {
        at: new Date,
        port
      }
    });
  });

  async function sendAction(action) {
    // send action to browser
    switch(action.type) {
      case "click":
        const {x,y} = action;
        await page.mouse.click(x,y, {delay: CLICK_DELAY});
        break;
      case "typing":
        const {text} = action;
        await page.keyboard.type(text, {delay: TYPE_DELAY});
        break;
      default: {
        console.warn(`Error with action`, action);
        throw new TypeError(`sendAction received unknown action of type: ${action.type}`);
      } break;
    }
    await broadcastShot();
    await Promise.race([sleep(SHOT_DELAY), page.waitForNavigation({timeout:SHOT_DELAY})]);
    await broadcastShot();
  }

  async function broadcastShot() {
    if ( state.shooting ) return;
    console.log(`Shooting`);
    state.shooting = true;
    state.latestShot = await page.screenshot(SHOT_OPTS);
    state.shooting = false;
    state.clients.forEach(({mjpeg, ip}) => {
      try {
        //console.log(state.latestShot);
        mjpeg.write(state.latestShot);
        //console.log(`Write done`);
      } catch(e) {
        console.warn(`Error on send MJPEG frame to client`, e, {mjpeg, ip});
      }
    });
  }
}

function BrowserView(state) {
  return `
    <!DOCTYPE html>
    <meta name=viewport content=width=device-width,initial-scale=1>
    <title>
      Puppetromium 
      | 
      World's Simplest Browser. 
      No client-side JavaScript. 
      Base on Puppeteer.
    </title>
    <style>
      :root, body, form {
        margin: 0;
        padding: 0;
        border: 0;
        min-height: 100%;
        height: 100%;
      }
    </style>
    <body>
      <form target=input method=POST action=/carpediem>
        <input type=image src=/viewport.mjpeg name=viewport title="Puppetromium Viewport. Click here to interact." alt="Puppetromium Viewport. Click here to interact.">
      </form>
      <iframe id=input_overlay name=input src=/input_overlay.html></iframe>
    </body>
  `
}

function InputOverlay(state) {
  return `
    <!DOCTYPE html>
    <meta name=viewport content=width=device-width,initial-scale=1>
    <title>
      Puppetromium InputOverlay
      | 
      World's Simplest Browser. 
      No client-side JavaScript. 
      Base on Puppeteer.
    </title>
    <style>
      :root, body, form {
        margin: 0;
        padding: 0;
        border: 0;
        min-height: 100%;
        height: 100%;
      }
    </style>
    <body>
      <form method=POST action=/carpediem>
        <input type=text placeholder="Type your truth">
        <button>Send</button>
      </form>
    </body>
  `
}




