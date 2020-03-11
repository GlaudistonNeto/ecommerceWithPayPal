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


app.get("/", (req, res) => {

    res.render("index");

});

app.post('/buying', (req, res) => {

    var email = req.body.email;
    var id = req.body.id;

    var {name, price, amount} = req.body;

    var total = price * amount;

    console.log(total);

    var paying = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `http://localhost:45567/final?email=${email}&id=${id}&total=${total}`,
            "cancel_url": "http://cancel.url"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": name,
                    "sku": name,
                    "price": price,
                    "currency": "BRL",
                    "quantity": amount
                }]
            },
            "amount": {
                "currency": "BRL",
                "total": total
            },
            "description": "This is the payment description."
        }]
    };

    paypal.payment.create(paying, (error, payment) => {
        
        if(error){
            console.log(error);
        }else{

            for(var i = 0; i < payment.links.length; i++){
                var p = payment.links[i];
                if(p.rel === "approval_url"){
                    res.redirect(p.href);
                }
            }
        }
    });
});

app.get("/final", (req, res) => {
    var payerId = req.query.PayerID;
    var paymentId = req.query.paymentId;

    var clientMail = req.query.email;
    var clientId = req.query.id;
    var total = req.query.total;

    console.log(clientMail);
    console.log(clientId);

    var final = {
        "payer_id": payerId,
        "transactions": [{
            "amount":{
                "currency": "BRL",
                "total": total
            }
        }]
    }

    paypal.payment.execute(paymentId,final,(error, payment) => {

        if(error){
            console.log(error);
        }else{
            res.json(payment);
        }
    });
});

app.listen(45567, () => {
    console.log("Running!")
})