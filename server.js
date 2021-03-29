'use strict';

/**
 * req => all the info about the request the server received
 * res => methods which can be called to create and send a responceto server
 */

require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT;
const superagent = require('superagent');
let app = express();
const cors = require('cors');
app.use(cors());


app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/parks', handleParks);
app.get('*', handleErrors);


app.listen(PORT, ()=>{
    console.log(`the app is listening to ${PORT}`);
});

function handleLocation (req, res) {
    try {
        let srchQ = req.query.city;
        getLocationData(srchQ, res);
    } catch(error) {
        res.status(500).send(`Oops, something went wrong ${error}`);
    }
}
function handleWeather (req, res) {
    try{
        let searchQuery = req.query.city;
        let latitude = req.query.latitude;
        let longitude = req.query.longitude;
        getWeatherData(searchQuery, latitude, longitude, res);
    }catch(error){
        res.status(500).send(`Oopsy, something went wrong ${error}`);
    }
}
function handleParks (req, res){
    try {
        let searchQuery = req.query.search_query;
        getParksData(searchQuery, res);
    } catch (error) {
        res.status(500).send(`Oopsy, something went wrong ${error}`);
    }
}
function handleErrors (req, res) {
    res.status(404).send({ status: 404, responseText: 'Sorry, this page Does not exist'});
}

function CityLocation(srchQ, dsplyNam, lat, long){
    this.search_query = srchQ;
    this.formatted_query = dsplyNam;
    this.latitude = lat;
    this.longitude = long;
}

function CityWeather(srchQ, wthrDesc, time){
    this.search_query = srchQ;
    this.forecast = wthrDesc;
    this.time = time;
}

function CityParks (name, address, fee, description, url){
    this.name = name;
    this.address = address;
    this.fee = fee;
    this.description = description;
    this.url = url;
}

function getLocationData (searchQuery, res) {
    // get data array from json
    const query = {
        key: process.env.GEOCODE_API_KEY,
        q: searchQuery,
        limit: 1,
        format: 'json'
    };
    let url = 'https://us1.locationiq.com/v1/search.php';
    superagent.get(url).query(query).then(data => {
        try {
            // let locationData = require('./data/location.json');
            let displayName = data.body[0].display_name;
            let latitude = data.body[0].lat;
            let longitude = data.body[0].lon;
            let resObj = new CityLocation(searchQuery, displayName, latitude, longitude);
            res.status(200).send(resObj);
        } catch (error) {
            res.status(500).send(`Oopsy, there is API errors ${error}`).then(() => {
                console.log('Message sent');
            }).catch((error) => {
                console.log(error.response.body);
                // console.log(error.response.body.errors[0].message)
            });
        }
    });
}
function getWeatherData(searchQuery, latitude, longitude, res){
    // get data array from json
    const query = {
        city: searchQuery,
        lat: latitude,
        long: longitude,
        key: process.env.WEATHER_API_KEY,
        days: 8
    };
    let url = 'https://api.weatherbit.io/v2.0/history/daily';
    superagent.get(url).query(query).then(data => {
        try {
            let obj = JSON.parse(data.text);
            let wthrArry = [];
            for(let i = 0 ; i < obj.data.length; i++ ){
                let weatherDesc = obj.data[i].weather['description'];
                let time = obj.data[i].datetime;
                time = time.replace('-','/');
                let date = new Date(time);
                let dateStr = date.toString();
                let newDate = dateStr.slice(' ',16);
                let resObj = new CityWeather(searchQuery, weatherDesc, newDate);
                wthrArry.push(resObj);
            }
            res.status(200).send(wthrArry).then(() => {
                console.log('Message sent');
            }).catch((error) => {
                console.log(error.response.body);
                // console.log(error.response.body.errors[0].message)
            });
        } catch (error) {
            res.status(500).send(`Oopsy, there is API errors ${error}`);
        }
    });
}
function getParksData (searchQuery, res){
    // get data array from json
    const query = {
        q: searchQuery,
        api_key: process.env.PARKS_API_KEY
    };
    let url = `https://developer.nps.gov/api/v1/parks`;
    superagent.get(url).query(query).then(data => {
        try {
            let obj = data.body.data;
            let parks = [];
            for (let i = 0; i < obj.length; i++) {
                let name = obj[i].name;
                let address = `"${obj[i].address[0].line1}"
                                , "${obj[i].address[0].city}"
                                , "${obj[i].address[0].stateCode}"
                                , "${obj[i].address[0].postalCode}"`;
                let fee = obj[i].fee;
                let description = obj[i].description;
                let url = obj[i].url;
                let resObj = new CityParks(name, address, fee, description, url);
                parks.push(resObj);
            }
            res.status(200).send(parks).then(() => {
                console.log('Message sent');
            }).catch((error) => {
                console.log(error.response.body);
                // console.log(error.response.body.errors[0].message)
            });
        } catch (error) {
            res.status(500).send(`Oopsy, there is API errors ${error}`);
        }
    });
}
