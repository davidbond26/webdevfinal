const http = require("http");
const path = require("path");
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
// const portNumber = 5001;
const statusCode = 200;
const bodyParser = require("body-parser");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, './.env') }) 

const mdbuser = process.env.MONGO_DB_USERNAME;
const mdbpass = process.env.MONGO_DB_PASSWORD;
const mdbname = process.env.MONGO_DB_NAME;
const mdbcollection = process.env.MONGO_DB_COLLECTION;

const uri = `mongodb+srv://${mdbuser}:${mdbpass}@${mdbname}.6cseb.mongodb.net/?retryWrites=true&w=majority&appName=${mdbname};`

const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.static('public'));

process.stdin.setEncoding("utf8");

if (process.argv.length != 2) {
    process.stdout.write(`Usage ${process.argv[1]}`);
    process.exit(1);
}

console.log(`Web server is running at TODO`);

async function getJSONData(site) {
    const result = await fetch(
      site
    );
    const json = await result.json();
  
    return json;
}

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  const dataInput = process.stdin.read();
  if (dataInput !== null) {
    const command = dataInput.trim();
    if (command === "stop") {
        process.stdout.write("Shutting down the server\n");
        process.exit(0);
    } else {
        process.stdout.write(`Invalid command: ${command}\n`);
        process.stdout.write(prompt);
    }
    process.stdin.resume();
  }
});

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/view", async (request, response) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(mdbname)
        .collection(String(mdbcollection))
        .find(filter);
        let result = await cursor.toArray();
        console.log(result);
        let resultstr = "";
        let unique_dog_names = [];
        result.forEach(elem => {
            if (!unique_dog_names.includes(elem.dogname)) {
                unique_dog_names.push(elem.dogname);
            }
        });
        console.log(unique_dog_names);
        unique_dog_names.forEach((dogname) => {
            console.log(dogname);
            resultstr += `<h3>${dogname}</h3>`;
            resultstr += `<br>`;
            result.forEach((elem2) => {
                if (elem2.dogname === dogname) {
                    resultstr += `<img src=\"${elem2.img}\">`;
                }
            });
        });
        const variables = {
            data: resultstr
        };
        response.render("view", variables);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.get("/browse", (request, response) => {
    response.render("browse");
});

app.get("/removeall", (request, response) => {
    response.render("removeall");
});
app.get("/removeconfirmation", async (request, response) => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const result = await client.db(mdbname)
        .collection(String(mdbcollection))
        .deleteMany({});
        response.render("removeconfirmation");
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/selectphotos", async (request, response) => {
    let {dogname} = request.body;
    let jsonData;
    dogname = String(dogname);
    let doglinkthing = dogname;
    if (dogname.includes("-")) {
        let splitarr = dogname.split("-");
        doglinkthing = `${splitarr[0]}/${splitarr[1]}`
        dogname = `${splitarr[0]} ${splitarr[1]}`
    }
    if (dogname.includes(" ")) {
        let splitarr = dogname.split(" ");
        doglinkthing = `${splitarr[0]}/${splitarr[1]}`
        dogname = `${splitarr[0]} ${splitarr[1]}`
    }
    console.log(dogname);
    console.log(doglinkthing);
    await (async () => {
        try {
            const data = await getJSONData(`https://dog.ceo/api/breed/${doglinkthing}/images/random`);
            console.log("***** Data Retrieved *****");
            console.log(data);
            jsonData = data
        } catch (e) {
            console.log("ERROR, ERROR: " + e);
        }
    })();
    if (jsonData.status !== "success") {
        console.log("bruh");
        response.render("index");
    }
    let photo = jsonData.message;

    const variables = {
        dogname,
        photo
    };
    response.render("selectphotos", variables);
});

app.post("/photoadded", async (request, response) => {
    console.log(request.body);
    let {img, dogname} = request.body;
    const variables = {
        dogname,
        img
    }
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const result = await client.db(mdbname).collection(String(mdbcollection)).insertOne(variables);
        response.render("photoadded");
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

});

app.listen("5001");