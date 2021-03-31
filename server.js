'use strict';

/**
 * req => all the info about the request the server received
 * res => methods which can be called to create and send a responceto server
 */

require('dotenv').config();

const express = require('express');

const cors = require('cors');

const superagent = require('superagent');


const PORT = process.env.PORT;

const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const PARKS_API_KEY = process.env.PARKS_API_KEY;

const MOVIE_API_KEY = process.env.MOVIE_API_KEY;

const YELP_API_KEY = process.env.YELP_API_KEY;

const DATABASE_URL = process.env.DATABASE_URL;


let app = express();

app.use(cors());

let pg = require('pg');

let page = 1;

const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {rejectUnauthorized: false}
});

app.get('/location', handleLocation);

app.get('/weather', handleWeather);

app.get('/parks', handleParks);

app.get('/movies', handleMovies);

app.get('/yelp', handleYelp);

// app.get('/', handleErrors);

// app.get('*', handleErrors);

// DATABASE_URL = postgres://azooz_new_exp:new3@localhost:3000/city_tracker
client.connect().then(() =>{
    app.listen(PORT, ()=>{
        console.log(`the app is listening to => ${PORT}`);
    });
}).catch(error => {
    console.log(`Sorry, Error connicting to DataBase => ${error}`);
});

function handleLocation (req, res) {
    try {
        let srchQ = req.query.city;
        getLocationData(srchQ, res);
    } catch(error) {
        res.status(500).send(`Oops, something went wrong => ${error}`);
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
        res.status(500).send(`Oopsy, something went wrong => ${error}`);
    }
}
function handleMovies(req,res){
    try {
        let searchQuery = req.query.search_query;
        getMoviesData(searchQuery, res);
    } catch (error) {
        res.status(500).send(`Oopsy, something went wrong => ${error}`);
    }
}
function handleYelp(req, res){
    try {
        let searchQuery = req.query.search_query;
        // let lat = req.query.latitude;
        // let lon = req.query.longitude;
        getYelpData(searchQuery,res);
    } catch (error) {
        res.status(500).send('Sorry, something went wron' + error);
    }
}

// function handleErrors (req, res) {
//     res.status(404).send({ status: 404, responseText: `Sorry, this page Does not exist => ${res.data} RRRRRRR => ${req.data}`});
// }

function CityLocation (srchQ, dsplyNam, lat, long){
    this.search_query = srchQ;
    this.formatted_query = dsplyNam;
    this.latitude = lat;
    this.longitude = long;
}

function CityWeather (srchQ, wthrDesc, time){
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

function CityMovies (title, overview, average_votes, total_votes, image_url, popularity, released_on){
    this.title = title;
    this.overview = overview;
    this.average_votes = average_votes;
    this.total_votes = total_votes;
    this.image_url = image_url;
    this.popularity = popularity;
    this.released_on = released_on;
}

function CityYelp (name, image_url, price, rating, url){
    this.name= name;
    this.image_url = image_url;
    this.price = price;
    this.rating = rating;
    this.url = url;
}

function getLocationData (searchQuery, res) {
    let sqlQuery = 'SELECT * FROM CityLocation WHERE city_name = ($1);';
    let value = [searchQuery];
    client.query(sqlQuery, value).then(data => {
        console.log(sqlQuery);
        if (data.rows.length === 0){
            const query = {
                GEOCODE_API_KEY: GEOCODE_API_KEY,
                searchQuery: searchQuery,
                limit: 1,
                format: 'json'
            };
            let url = `https://us1.locationiq.com/v1/search.php?key=${query.GEOCODE_API_KEY}&q=${query.searchQuery}&format=${query.format}`;
            superagent.get(url).query(query).then(data => {
                try {
                    let displayName = data.body[0].display_name;
                    let latitude = data.body[0].lat;
                    let longitude = data.body[0].lon;
                    let sqlQuery = `INSERT INTO CityLocation(city_name, display_name, latitude, longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
                    let values = [searchQuery,displayName,latitude,longitude];
                    client.query(sqlQuery,values).then(data =>{
                        console.log(`data returned back from db =>${data}`);
                    }).catch(err => {
                        res.status(500).send(`inside then ${err}`);
                    });
                    let resObj = new CityLocation(searchQuery, displayName, latitude, longitude);
                    res.status(200).send(resObj);
                } catch (error) {
                    res.status(500).send(error);
                }
            }).catch(error => {
                res.status(500).send(`Oopsy, there is API errors => ${error}`);
            });
        }
        else{
            let resObj = new CityLocation(data.rows[0].city_name, data.rows[0].display_name, data.rows[0].latitude, data.rows[0].longitude);
            res.status(200).send(resObj);
        }

    }).catch(error => {
        console.log(`Sorry, There is a problem getting data => ${error}`);
    });
}
function getWeatherData(searchQuery, latitude, longitude, res){
    // get data array from json
    const query = {
        city: searchQuery,
        lat: latitude,
        long: longitude,
        key: WEATHER_API_KEY,
    };
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${query.city},NC&key=${query.key}`;
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
            // console.log('line 134');
            // res.status(200).send(wthrArry).then(() => {
            //     console.log('line 136');
            //     console.log('Message sent');
            // }).
        } catch (error) {
            res.status(500).send(`Oopsy, there is API errors => ${error}`);
        }
    }).catch((error) => {
        console.log(error.response.body.errors[0].message);
    });
}
function getParksData (searchQuery, res){
    // get data array from json
    console.log('not here');
    const query = {
        searchQ: searchQuery,
        PARKS_API_KEY: PARKS_API_KEY
    };
    let url = `https://developer.nps.gov/api/v1/parks?parkCode=${query.searchQ}&api_key=${query.PARKS_API_KEY}`;
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
                console.log('Message sent');
                console.log(error.response.body);
                res.status(500).send(error);
            });
        } catch (error) {
            res.status(500).send(`Oopsy, there is API errors => ${error}`);
        }
    });
}
function getMoviesData(searchQuery, res){
    const query ={
        key: MOVIE_API_KEY,
        q : searchQuery
    };
    let url = `https://api.themoviedb.org/3/movie/550?api_key=${query.key}`;
    superagent.get(url).query(query).then(data=>{
        console.log(data.body.results.length);
        let movieArray = [];
        try{
            for(let i = 0 ; i< data.body.results.length;i++){
                console.log(data.body.results[i]);
                let title = data.body.results[i].title;
                let overview = data.body.results[i].overview;
                let average_votes = data.body.results[i].vote_average;
                let total_votes = data.body.results[i].vote_count;
                let img_url = `https://image.tmdb.org/t/p/w500/${data.body.results[i].poster_path}`;
                let popularity = data.body.results[i].popularity;
                let date_released = data.body.results[i].release_date;
                let movie = new CityMovies(title, overview, average_votes, total_votes, img_url, popularity, date_released);
                movieArray.push(movie);
            }
            res.status(200).send(movieArray);
        }catch(error){
            res.status(500).send(error);
        }
    }).catch(error =>{
        res.status(500).send(error);
    });
}
function getYelpData (searchQuery, res) {
    const page_number = 5;
    const start_page = ((page - 1) * page_number + 1);
    // yelp Clinet ID = e9O2hxux9rAsVUoJgS9UIA
    let query = {
        key: YELP_API_KEY,
        location: searchQuery,
        limit: page_number,
        offset: start_page
    };
    page++;
    let url = ``;
    superagent.get(url).query(query).set(`Authoraization`, `Bearer${query.key}`).then(data => {
        try {
            let yelp_arrey = [];
            let obj = JSON.parse(data.text).businesses;
            for (let i = 0; i < obj.length; i++) {
                let name = obj[i].name;
                let image_url = obj[i].image_url;
                let price = obj[i].price;
                let rating = obj[i].rating;
                let url = obj[i].url;
                let yelp = new CityYelp (name, image_url, price, rating, url);
                yelp_arrey.push(yelp);
            }
        } catch (error) {
            console.log(error.response.body);
            res.status(500).send(error);
        }
    }).catch((error) => {
        res.status(500).send(`Oopsy, there is API errors => ${error}`);
    });
}
