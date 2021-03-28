const express = require('express');

const coordinates  = require('coordinates');
const app = express();



const handleRequest = (request, responce) => {
    // console.log(request.query);
    responce.send('ok');
};

const PORT = 3000;

app.use(coordinates());


app.get('/', handleRequest);
app.get('/location', handleRequest);


app.listen(PORT, () => {
    console.log(`A Z O O Z server is listening on ${PORT}`);
});
/**
 * req => all the info about the request the server received
 * res => methods which can be called to create and send a responceto server
 */

