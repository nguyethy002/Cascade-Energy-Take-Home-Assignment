import express from "express";
import csv from "csvtojson";
import dayjs from "dayjs";

interface ArrayHistoryData {
  Name: string;
  "Date time": string;
  "Maximum Temperature": string;
  "Minimum Temperature": string;
  Temperature: string;
  "Wind Chill": string;
  "Heat Index": string;
  Precipitation: string;
  Snow: string;
  "Snow Depth": string;
  "Wind Speed": string;
  "Wind Direction": string;
  "Wind Gust": string;
  Visibility: string;
  "Cloud Cover": string;
  "Relative Humidity": string;
  Conditions: string;
}

interface QueryDate {
  startDate: string;
  endDate: string;
}
const app = express();
const port = 8080; // default port to listen

const csvFilePath = __dirname + "/history_data_hourly.csv";
const DATE_FORMAT = "MM-DD-YYYY H:mm:ss";
const AC_THRESHOLD = 75;
const HEATER_THRESHOLD = 62;

// define a route handler for the default home page
// this page will display how many times the ac and the heat turned on in a specific time range from user's params in URL
// the formate of the URL would be, for examople http://localhost:8080/?startDate=06/18/1%2001:00:00&endDate=06/19/2020%2000:00:00
app.get("/", async (req, res) => {
  let counterAc = 0;
  let counterHeat = 0;

  const query = req.query as unknown as QueryDate;

  const startDate = dayjs(query.startDate, DATE_FORMAT);
  const endDate = dayjs(query.endDate, DATE_FORMAT);

  const csvData: ArrayHistoryData[] = await csv().fromFile(csvFilePath);

  for (const historyDatum of csvData) {
    const currentDate = dayjs(historyDatum["Date time"], DATE_FORMAT);
    const currentTemp = parseFloat(historyDatum.Temperature);

    if (startDate <= currentDate && currentDate <= endDate) {
      if (!currentTemp) {
        console.log("No temperature was entered");
      } else if (currentTemp > AC_THRESHOLD) {
        counterAc++;
      } else if (currentTemp < HEATER_THRESHOLD) {
        counterHeat++;
      }
    }
  }

  res.send(
    `<h1> Total heat counts in the enetered time range: ${counterHeat} </h1> <h1> Total ac counts in the enetered time range: ${counterAc} </h1> `
  );
});

// this page will display how many times the ac and the heat turned on at least once based on the whole data file.
app.get("/report", async (req, res) => {
  const csvData: ArrayHistoryData[] = await csv().fromFile(csvFilePath);
  // Look up map to store counter for date that turns on AC/Heater at least 1 time
  const dateLookupMap: Record<string, boolean> = {};
  let dateCounter = 0;

  csvData.forEach((historyDatum) => {
    const curDate = dayjs(historyDatum["Date time"], DATE_FORMAT);
    const curDay = curDate.date();

    const currentTemp = parseFloat(historyDatum.Temperature);
    if (currentTemp > AC_THRESHOLD || currentTemp < HEATER_THRESHOLD) {
      if (!dateLookupMap[curDay]) {
        dateLookupMap[curDay] = true;
        dateCounter++;
      }
    }
  });

  res.send(
    `<h1> Number of date with AC or Heater turned on at least once for the whole dates: ${dateCounter} </h1>`
  );
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
