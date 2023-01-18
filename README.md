# :tophat: [puppetromium](https://github.com/crisdosyago/puppetromium) ![npm](https://img.shields.io/npm/dt/puppetromium?style=social) ![npm](https://img.shields.io/npm/v/puppetromium?color=00ffee)

![puppetromium in action](https://github.com/crisdosyago/puppetromium/raw/main/puppetromium.PNG)

## A simple browser UI for puppeteer, built with no client-side JavaScript.

**Puppetromium** is a [single file](https://github.com/crisdosyago/puppetromium/blob/main/src/index.js) simple web-browser built on Puppeteer. If Chromium, Puppeteer and 1987 had a love child, it would be this oddly adorable. Probably. 

Also, **there is no (as in zero "0") client-side scripting (in this browser UI) of any kind. No JavaScript. No ActionScript. No Flash. This crazy-simple remote browser UI is built entirely with HTML and CSS.**

## How is this possible?

With the power ⚡ 💪, my friend, of the following ancient®️ techs©️ from ye olde webbe:

- [MJPEG](https://en.wikipedia.org/wiki/Motion_JPEG) to stream the remote viewport with server-push only
- [`<input type=image src=/viewport.mjpeg>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/image#using_the_x_and_y_data_points) to capture X and Y co-ordinates of pointer events and post them to the server on click. 
- [targeted forms](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-target) and [named iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-name) to allow transmitting actions like 'type text' or 'scroll down' without reloading the top-level page. 

## but why?

Mostly as an exercise. To see how simple I get a remote browser that is still minimally usable. But also as an example of why puppeteer is not a great fit for this. And a reminder why I created a [whole other browser driving](https://github.com/crisdosyago/BrowserBox/blob/master/zombie-lord/controller.js) [protocol atop the DevTools protocol](https://github.com/crisdosyago/BrowserBox/blob/master/zombie-lord/connection.js) for my custom [remote isolated browser](https://github.com/crisdosyago/BrowserBox). 

Also because I thought people will think a browser UI built with Puppeteer is cool, and it might encourage them to get into remote browsing, and custom browser UIs for cloud browsers, and hack on top of it. I wanted to release something with a very [permissive license](https://github.com/crisdosyago/puppetromium/blob/main/LICENSE), that might spark people's imaginations about how they could use this kind of tech in their own project. I wanted something I could build in 1 day (and indeed, it took me around 6 hours). I wanted something where I wasn't restricted by the need to keep the license strict (e.g., AGPL-3.0), in order to preserve my business of selling corporate license exceptions and SaaS deployments. 

I wanted to give people a way they could get their toes wet, without having to pay anything, and so they might build their own on top of it. Because the type of people who would probably find this useful to hack on, are not the type of people who want to pay for a corporate license.

## so, how simple is it?

A single NodeJS file that serves **everything**, 350 source lines of code, 6 endpoints (5 GET, 1 POST), 1 export and 3 external imports (express, mjpeg-server, and of course puppeteer).

## okay, but how you size the remote browser viewport to roughly match my screen without any client-side JavaScript, what crazy majyck is this?

With, my friend, the following ingenious idea:

```javascript
/* code to set the viewport approx size without client side JS */
    // for all w and h combinations that are relevant
    `@media screen and (min-width: ${w}px) and (min-height: ${h}px) {
      body {
        background-image: url("/set-viewport-dimensions/width/${w}/height/${h}/set.png") 
      }
    }`

    app.get('/set-viewport-dimensions/width/:width/height/:height/set.png', async (req, res) => {
      const ua = req.headers['user-agent'];
      const isMobile = testMobile(ua);
      let {width,height} = req.params;

      width = parseFloat(width);
      height = parseFloat(height);
     
      await page.emulate({
        viewport: {
          width,
          height,
          isMobile
        },
        userAgent: ua
      });
    ...
```

## How can I too? :gem:

Note that you may first want to export the following environment variables (change depending on your local Chrome-compatible browser binary path), this skips the lengthy and bandwidth expensive (and npm cache expensive, poor little old npm!) download of chromium endemic to puppeteer:

```shell
$ export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
$ export PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

Then you can get into it quickly, as follows.

## Install mantra alternatives:

```sh
$ git clone https://github.com/crisdosyago/puppetromium.git
$ cd puppetromium
$ npm i 
$ npm test
```

Or `npm start <... your port ...>` where your port is the port you want to run it on.

Or you can `npm i --save` the package and then:
```
Then:
```js
import {start} from 'puppetromium';
start({port:8080, url:'https://jspaint.app'});
```

Or:
```sh
$ npx puppetromium@latest 8080
# or
$ npm i -g puppetromium@latest
$ puppetromium 8080
```

## Linux and Linuxes

**NOTE:** If you're on Linux you should run `npm run nixinstall` after npm i. 
This will install the dependencies.

## HELP! It broke

It's probably because of puppeteer dependencies. Make sure you have them all installed. I included a bunch of dependency scripts tailed to Debian (which may work on other Linuxes, but your mileage may encounter variability). 
