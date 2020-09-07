const { WebClient, Methods } = require("@slack/web-api");
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const axios = require("axios");
const web = new WebClient(process.env.SLACK_TOKEN);
const qs = require("querystring");
// const { createEventAdapter } = require('@slack/events-api');
// const slackEvents = createEventAdapter(process.env.SLACK_SECRET);
// app.use('/slack/events',slackEvents.expressMiddleware())
const fetch = require("node-fetch");
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));

const CLIMATE = [
  "weather",
  "temperature",
  "climate",
  "Climate",
  "Temperature",
  "Weather",
];

app.post("/hello", async (req, res) => {
  try {
    await web.chat.postMessage({
      channel: process.env.CHANNEL,
      text: `Hello @${req.body.user_name}`,
    });
    return res.send(`Hello @${req.body.user_name}`);
  } catch (error) {
    console.log(error);
    return res.json({ ok: true });
  }
});

app.post("/getText", (req, res) => {
  // console.log(req.body);
  if (req.body.token == process.env.SLACK_VERIFICATION_TOKEN)
    return res.send(req.body.challenge);
  if (
    req.body.event.bot_profile !== undefined &&
    req.body.event.bot_profile.id === "B01A41E149K"
  ) {
    return res.end();
  } else {
    const event = req.body.event;
    console.log(event);
    let flag = 0;
    for (i = 0; i < CLIMATE.length; i++) {
      if (event.text.includes(CLIMATE[i])) {
        flag = 1;
        break;
      }
    }
    if (flag == 1) {
      console.log("checking");
      Weather(req, res);
      res.sendStatus(200);
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end();
    }
  }
});

//TODO: Return Weather with proper formatting and log as well
app.post("/weather", async (req, res) => {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    body: {
      text: `Let me check the weather in ${city} for you!`,
      response_type: "ephemeral",
    },
  });
  console.log(city);
  try {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`;
    fetch(url)
      .then((data) => data.json())
      .then(async (resp) => {
        // console.log(resp);
        const tempA = Math.trunc(resp.main.temp - 273);
        const tempF = Math.trunc(resp.main.feels_like - 273);
        const humidity = resp.main.humidity;
        const text = `Weather in ${city} is ${tempA}\xB0C but feels like ${tempF}\xB0C with ${humidity}% humidity`;
        console.log(text);
        await web.chat.postMessage({
          channel: process.env.CHANNEL,
          text: text,
        });
        console.log(text);
        return res.send(text);
      });
  } catch (err) {
    console.log(err);
  }
});

async function Weather(req, res) {
  // console.log(body);
  const response = await axios.post(
    "https://city-extractor.herokuapp.com/getcity",
    {
      text: req.body.event.text.trim(),
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  let text;
  let message = {};
  console.log(response.data.city[0]);
  const CITY = response.data.city[0];
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${process.env.WEATHER_API_KEY}`;
  fetch(url)
    .then((data) => data.json())
    .then(async (resp) => {
      // console.log(resp);
      const tempA = Math.trunc(resp.main.temp - 273);
      const tempF = Math.trunc(resp.main.feels_like - 273);
      const humidity = resp.main.humidity;
      text = `${CITY} is at ${tempA}\xB0C but feels like ${tempF}\xB0C with ${humidity}% humidity`;
      console.log(text);
      await web.chat.postMessage({
        channel: process.env.CHANNEL,
        text: text,
      });
      return res.end();
    });
  // res.send("completed");
}

app.listen(port, (err) => {
  if (err) return res.send(err);
  console.log(`Listening on port: ${port}`);
});
