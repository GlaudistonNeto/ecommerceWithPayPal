const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const paypal = require('paypal-rest-sdk');

// View engine
app.set('view engine','ejs');

//Body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AblFylxj8Y7_aA7GBx7RuawbDC81m1fxBQDMiwTGPgo_AW8QB7vbqmyqjgxQ6LeRSMc_cOU7fP7pobSz',
    'client_secret': 'EEHGGcX8qJzH3rpPob3Xsv-9pA2NkBlwnNMR9p5vTqEk3mVUpvqlLOd8NJuI1a6VJ9JTOuEa3OfiQ7ej'
});


app.get("/",(req, res) => {

    res.render("index");

});


app.listen(45567, () => {
    console.log("Running!")
})

