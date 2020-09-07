const { WebClient, Methods } = require("@slack/web-api");
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const axios = require("axios");
const web = new WebClient(process.env.SLACK_TOKEN);
// const { createEventAdapter } = require('@slack/events-api');
// const slackEvents = createEventAdapter(process.env.SLACK_SECRET);
// app.use('/slack/events',slackEvents.expressMiddleware())
const fetch = require("node-fetch");
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));
app.post("/hello", async (req, res) => {
  try {
    await web.chat.postMessage({
      channel: process.env.CHANNEL,
      text: `Hello @${req.body.user_name}`,
    });
    return res.send(`Hello @${req.body.user_name}`);
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
});

app.post("/getText", async (req, res) => {
  console.log(req.body);

  return res.send(req.body.text);
});

//TODO: Return Weather with proper formatting and log as well
app.post("/weather", async (req, res) => {
  const city = req.body.text.trim();

  await fetch(
    "https://hooks.slack.com/services/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",
    {
      method: "POST",
      body: {
        text: `Let me check the weather in ${city} for you!`,
        response_type: "ephemeral",
      },
    }
  );
  console.log(city);
  try {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`;
    fetch(url)
      .then((data) => data.json())
      .then(async (resp) => {
        console.log(resp);
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

app.post("/getCity", async (req, res) => {
  const body = { text: req.body.text.trim() };
  console.log(body);
  const response = await axios.post(
    "http://localhost:5000/getcity",
    {
      text: req.body.text.trim(),
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  console.log(response.data.city[0]);
;
  const CITY = response.data.city[0];
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${process.env.WEATHER_API_KEY}`;
  fetch(url)
    .then((data) => data.json())
    .then(async (resp) => {
      console.log(resp);
      const tempA = Math.trunc(resp.main.temp - 273);
      const tempF = Math.trunc(resp.main.feels_like - 273);
      const humidity = resp.main.humidity;
      const text = `Weather in ${CITY} is ${tempA}\xB0C but feels like ${tempF}\xB0C with ${humidity}% humidity`;
      console.log(text);

      // console.log(text);
      return res.send(text);
    });
  // res.send("completed");
});

app.listen(port, (err) => {
  if (err) return res.send(err);
  console.log(`Listening on port: ${port}`);
});
