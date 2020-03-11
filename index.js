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

app.get('/create', (req, res) => {
    var plan = {
        "name": "Silver Plan",
        "description": "A very cheap and much good plan!",
        "merchant_preferences": {
            "auto_bill_amount": "yes",
            "cancel_url": "http://www.cancel.com",
            "initial_fail_amount_action": "continue",
            "max_fail_attempts": "1",
            "return_url": "http://www.success.com",
            "setup_fee": {
                "currency": "BRL",
                "value": "0"
            }
        },
        "payment_definitions": [
            {
                "amount": {
                    "currency": "BRL",
                    "value": "0"
                },
                "cycles": "7",
                "frequency": "DAY",
                "frequency_interval": "1",
                "name": "Free Test",
                "type": "TRIAL"
            },
            {
                "amount": {
                    "currency": "BRL",
                    "value": "25"
                },
                "cycles": "0",
                "frequency": "MONTH",
                "frequency_interval": "1",
                "name": "Regular Silver",
                "type": "REGULAR"
            }            
        ],
        "type": "INFINITE"
    }

    paypal.billingPlan.create(plan,(err, plan) => {

        if(err){
            console.log(err)
        }else{
            console.log(plan);
            res.json(plan);
        }
    });
});

app.get('/list', (req, res) => {
    paypal.billingPlan.list({'status': 'ACTIVE'}, (error, plans) => {
        if(error){
            console.log(error);
        }else{
            res.json(plans);
        }
    });
});

app.get('/active/:id', (req, res) => {
    var changes = [{
        "op": "replace",
        "path": "/",
        "value": {
            "state": "ACTIVE"
        }
    }]

    paypal.billingPlan.update(req.params.id, changes, (err, result) => {
        if(err){
            console.log(err);
        }else{
            res.send("Change done!")
        }
    });
});

app.post('/sub', (req, res) => {
    var email = req.body.email;
    var planId = "P-4G442942YE293244XY7BHOKY";

    var isoDate = new Date(Date.now());
    isoDate.setSeconds(isoDate.getSeconds() + 4);
    isoDate.toISOString().slice(0, 19) + 'Z';

    var signUpData = {
        "name": "Silver Plan SignUp",
        "description": "PayPal payment agreement",
        "start_date": isoDate,
        "payer": {
            "payment_method": "paypal"
        },
        "plan": {
            "id": planId
        },
        "override_merchant_preferences": {
            "return_url": `http://localhost:45567/subreturn?email=${email}`,
            "cancel_url": "https://example.com/cancel"
        }
    }

    paypal.billingAgreement.create(signUpData, (error, signUp) => {
        if(error){
            console.log(error);
        }else{
            res.json(signUp);
        }
    });

});

app.get('/subreturn', (req, res) => {
    var email = req.query.email;
    var token = req.query.token;

    paypal.billingAgreement.execute(token, {}, (error, signUp) => {
        if(error){
            console.log(error)
        }else{
            res.json(signUp);
        }
    });
});

app.get('/info/:id', (req, res) => {
    var id = req.params.id;
    paypal.billingAgreement.get(id,(error, signUp) => {
        if(error){
            console.log(error);
        }else{
            res.json(signUp);
        }    
    });
});

app.get("/cancel/:id", (req, res) => {
    var id = req.params.id;

    paypal.billingAgreement.cancel(id, {"note":"Clent desagreement!"},(error, response) => {
        if(error){
            console.log(error);
        }else{
            res.send("cancelled subscription!");
        }
    });
});

app.listen(45567, () => {
    console.log("Running!")
})