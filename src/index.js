const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
// const fs = require('fs');

const app = express()
app.listen(8084, () => console.log('Example app listening on port 8084!'))


app.use(function (err, req, res, next) {
  res.status(500).send('Something broke!')
})
// var key = fs.readFileSync('key.pem');
// var cert = fs.readFileSync( 'cert.pem' );
// var options = {
// key: key,
// cert: cert
// };

// var https = require('https');
// https.createServer(options, app).listen(443);


app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}))



app.post('/test',(req,res)=>{
	// const imgUrl = req.body && req.body.message && (req.body.message.type === 'image') && req.body.message.body && req.body.message.body.url;
	const body = req.body;
	const promises = [];
	for(url in body){
		if(String(body[url]).match(/^((https).+)|((http).+)/)){
			const host = (new URL(body[url])).host
			promises.push(axios.get(`https://http-observatory.security.mozilla.org/api/v1/analyze?host=${host}&hidden=false`))
		}
	}
	Promise.all(promises)
	.then(results=>{
		let resp = results.map(n=>n.data);
		console.log(resp)
		res.send({test:JSON.stringify(resp)});
	})
	

})

app.get('/test',(req,res)=>{
	res.send('test');
})

app.get('/',(req,res)=>{
	res.send('working');
})