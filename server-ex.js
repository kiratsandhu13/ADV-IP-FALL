let fs = require('fs');
let zlib = require('zlib');
let readableStream = fs.createReadStream('./public/deer.jpg');
let writableStream = fs.createWriteStream('./public/deer2.jpg');
readableStream.pipe(writableStream);
// readableStream.pipe(zlib.createGzip()).pipe(writableStream);