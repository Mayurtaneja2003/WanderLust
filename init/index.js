require("dotenv").config({path: "../.env"});
const mongoose = require("mongoose");
const initData = require("./data.js");
const  Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL;

console.log("MongoDB Connection String:", dbUrl);

main()
    .then(()=>{
        console.log("Connected to MongoDB");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main() {
  await mongoose.connect(dbUrl);
}

const initDB=async()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj, owner:"67ef586a2163b680b58ecb21", geometry: { type: "Point", coordinates: [77.1025, 28.7041] }}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();