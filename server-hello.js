const http = require("http");

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer( (req, res) => {//function request
    res.write("Hello, Node.");
    res.end();// send back
});

server.listen(port, hostname, () => {// sever needs pre arguments and 
    //starts listening, function with no arguments is () 

    console.log(`Server running at http://${hostname}:${port}`);//message
});

// Use npx nodemon hello_node.js for auto-restart of server on changes