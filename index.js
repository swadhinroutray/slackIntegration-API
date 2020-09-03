const { WebClient, Methods } = require("@slack/web-api");
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
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
  // res.send({text:`Let me check the weather in ${city} for you!`})
  console.log(city);
  try {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`;
    fetch(url)
      .then((data) => data.json())
      .then(async (resp) => {
        console.log(resp);
        const tempA = Math.trunc(resp.main.temp - 273);
        const tempF = Math.trunc(resp.main.feels_like - 273);
        const humidity = resp.main.humidity
        const text = `Weather in ${city} is ${tempA}\xB0C but feels like ${tempF}\xB0C with ${humidity}% humidity`;
        console.log(text);
        // await web.chat.postMessage({
        //   channel: process.env.CHANNEL,
        //   text: text,
        // });
        console.log(text)
        res.send(text);        
       });
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, (err) => {
  if (err) return res.send(err);
  console.log(`Listening on port: ${port}`);
});
