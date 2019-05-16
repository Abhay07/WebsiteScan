const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');
const fs = require('fs');

const app = express()
app.listen(8085, () => console.log('Example app listening on port 8085!'))


app.use(function (err, req, res, next) {
  res.status(500).send('Something broke!')
})


app.use(bodyParser.json());

function getResults(promises,hosts,urlKeys){
	let resultArr = [];
	return new Promise((resolve,reject)=>{
		Promise.all(promises)
		.then(results=>{
			let resp = results.map(n=>n.data);
			let localHosts = [], localUrlKeys = [];
			promises.length = [];
			resp.forEach((n,i)=>{
				if(n.state != 'FINISHED'){
					localHosts.push(hosts[i]);
					localUrlKeys.push(urlKeys[i]);
					promises.push(axios.post(`https://http-observatory.security.mozilla.org/api/v1/analyze?host=${hosts[i]}`,{hidden:false,rescan:false}))
					return
				}
				const obj = {};
				const key = urlKeys[i].toLowerCase();
				obj.score = n.score;
				obj.url = hosts[i];
				if(n.score<20){
					obj[key] = {state:'unsafe', reason:'Security scan result is poor'};
				}
				else{
					obj[key] = {state:'safe'}
				}
				resultArr.push(obj);
			})
			if(promises.length == 0){
				resolve(resultArr);
				return;
			}
			setTimeout(()=>{
				getResults(promises,localHosts,localUrlKeys)
				.then((reslt)=>{
					resultArr = resultArr.concat(reslt);
					resolve(resultArr);
				})
				.catch((err)=>{
					reject(err);
				})
			},2000)


		})
		.catch((err)=>{
			reject(err);
		})
	})

}

app.post('/test',(req,res)=>{
	const body = req.body;
	const promises = [];
	const hosts = [];
	const urlKeys = [];
	for(url in body){
		if(String(body[url]).match(/^((https).+)|((http).+)/)){
			const host = (new URL(body[url])).host
			hosts.push(host);
			urlKeys.push(url);
			promises.push(axios.post(`https://http-observatory.security.mozilla.org/api/v1/analyze?host=${host}`,{hidden:false,rescan:false}))
		}
	}
	getResults(promises,hosts,urlKeys)
	.then(results=>{
		res.json([results]);
	})
	.catch((err)=>{
		console.log(err);
		res.status(500).send(err);
	})

})