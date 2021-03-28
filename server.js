'use strict';

/**
 * req => all the info about the request the server received
 * res => methods which can be called to create and send a responceto server
 */

require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT;
let app = express();
const cors = require('cors');
app.use(cors());


app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('*', handleErrors);


app.listen(PORT, ()=>{
    console.log(`the app is listening to ${PORT}`);
});

function handleLocation (req, res) {
    let srchQ = req.query.city;
    let locationObj = getLocationData(srchQ);
    try{
        res.status(200).send(locationObj);
    }catch(error){
        res.status(500).send(`Ooops, something went wrong ${error}`);
    }
}
function handleWeather (req, res) {
    let searchQuery = req.query.city;
    let wthrObj = getWeatherData(searchQuery);
    try{
        res.status(200).send(wthrObj);
    }catch(error){
        res.status(500).send(`Ooopsy, something went wrong ${error}`);
    }
}
function handleErrors (req, res) {
    res.status(404).send({ status: 500, responseText: 'Sorry, this page Does not exist'});
}

function CityLocation(srchQ, dsplyNam, lat, long){
    this.search_qury = srchQ;
    this.formatted_query = dsplyNam;
    this.latitude = lat;
    this.longitude = long;
}

function CityWeather(srchQ, wthrDesc, time){
    this.search_qury = srchQ;
    this.forecast = wthrDesc;
    this.time = time;
}

function getLocationData (searchQuery) {
    let locationData = require('./data/location.json');
    let displayName = locationData[0].display_name;
    let latitude = locationData[0].lat;
    let longitude = locationData[0].lon;
    let resObj = new CityLocation(searchQuery, displayName, latitude, longitude);
    return resObj;
}
function getWeatherData(searchQuery){
    let wthrData = require('./data/weather.json');
    let wthrArry = [];
    for(let i = 0 ; i <wthrData.data.length; i++ ){
        let weatherDesc = wthrData.data[i].weather['description'];
        let time = wthrData.data[i].datetime;
        time = time.replace('-','/');
        let date = new Date(time);
        let dateStr = date.toString();
        let newDate = dateStr.slice(' ',16);
        let resObj = new CityWeather(searchQuery, weatherDesc, newDate);
        wthrArry.push(resObj);
    }
    return wthrArry;
}
