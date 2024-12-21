'use strict';
import fs from "fs";
import jwt from "jsonwebtoken";

var privateKEY  = fs.readFileSync('./private.key', 'utf8');
var publicKEY  = fs.readFileSync('./public.key', 'utf8');

/*
 ====================   JWT Signing =====================
*/

var payload = {
 data1: "Data 1",
 data2: "Data 2",
 data3: "Data 3",
 data4: "Data 4",
};

var i  = 'Mysoft corp';   
var s  = 'some@user.com';   
var a  = 'http://mysoftcorp.in';

var signOptions = {
 issuer:  i,
 subject:  s,
 audience:  a,
 expiresIn:  "12h",
 algorithm:  "RS256"   // RSASSA [ "RS256", "RS384", "RS512" ]
};

var token = jwt.sign(payload, privateKEY, signOptions);
console.log("Token :" + token);

/*
 ====================   JWT Verify =====================
*/

var verifyoptions = {
 issuer:  i,
 subject:  s,
 audience:  a,
 expiresIn:  "12h",
 algorithm:  ["RS256"]
};

var legit = jwt.verify(token, publicKEY, verifyOptions);
console.log("\nJWT verification result: " + JSON.stringify(legit));