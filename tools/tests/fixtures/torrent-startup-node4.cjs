// Controlled loopback seeder; no public torrent or media download. Run with Node 4.4.3.
var fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),net=require('net'),http=require('http');
var bencode=require('bencode'),protocol=require('peer-wire-protocol');
var root=path.resolve(__dirname,'../../..'),pieceLength=4*1024*1024,count=16,hashes=[],requests=[];
for(var i=0;i<count;i++){var block=new Buffer(pieceLength);block.fill(i);hashes.push(crypto.createHash('sha1').update(block).digest());}
var info=bencode.encode({name:new Buffer('fixture.mp4'),length:pieceLength*count,'piece length':pieceLength,pieces:Buffer.concat(hashes)});
var hash=crypto.createHash('sha1').update(info).digest('hex'),torrent=Buffer.concat([new Buffer('d4:info'),info,new Buffer('e')]);
var bundle=fs.readFileSync(path.join(root,'dist/player-service.js'),'utf8');var context={require:require,process:process,Buffer:Buffer,setTimeout:setTimeout,clearTimeout:clearTimeout,setInterval:setInterval,clearInterval:clearInterval,console:console};
vm.runInNewContext(bundle.slice(0,bundle.indexOf('// Phone remote + header proxy')),context);
// Never reach a real router from tests: UPnP discovery goes to a closed local port.
context.TV_UPNP.configure({ssdpHost:'127.0.0.1',ssdpPort:9,timeout:200});
var seed=net.createServer(function(socket){var wire=protocol();socket.pipe(wire).pipe(socket);wire.on('error',function(){});socket.on('error',function(){});
wire.on('handshake',function(h){wire.handshake(h,new Buffer('-KT0001-123456789012'));wire.bitfield({buffer:new Buffer([255,255])});wire.unchoke();});
wire.on('request',function(index,offset,length,cb){requests.push(index);var data=new Buffer(length);data.fill(index);setTimeout(function(){cb(null,data);},5);});});
var server=http.createServer(),engine,finished=false,started=Date.now();
function finish(err){if(finished)return;finished=true;console.log(JSON.stringify({ok:!err,error:err&&err.message,elapsedMs:Date.now()-started,headBlockRequests:requests.filter(function(i){return i===0;}).length,tailBlockRequests:requests.filter(function(i){return i===15;}).length}));context.TV_TORRENT.destroyAll();server.close();seed.close();setTimeout(function(){process.exit(err?1:0);},50);}
setTimeout(function(){finish(new Error('controlled test timeout'));},20000);
seed.listen(0,'127.0.0.1',function(){var original=context.TorrentEngine;context.TorrentEngine=function(link,opts){opts.dht=false;opts.tracker=false;engine=original(torrent,opts);engine.connect('127.0.0.1:'+seed.address().port);return engine;};
context.TV_TORRENT.create({infoHash:hash,fileIdx:0},function(err,result){if(err)return finish(err);var poll=setInterval(function(){if(!engine.bitfield.get(0)||!engine.bitfield.get(15))return;clearInterval(poll);
if(requests.some(function(i){return i!==0&&i!==15;}))return finish(new Error('prefetch downloaded unrelated pieces'));
server.on('request',function(req,res){context.TV_TORRENT.serve(req,res,result.id);});server.listen(0,'127.0.0.1',function(){
function read(start,expected,cb){http.get({hostname:'127.0.0.1',port:server.address().port,path:'/',headers:{Range:'bytes='+start+'-'+(start+16383)}},function(res){var chunks=[];res.on('data',function(b){chunks.push(b);});res.on('end',function(){var data=Buffer.concat(chunks);if(res.statusCode!==206||data.length!==16384||data[0]!==expected)return finish(new Error('range payload mismatch'));cb();});}).on('error',finish);}
read(0,0,function(){read(pieceLength*15,15,function(){read(0,0,function(){if(requests.filter(function(i){return i===0;}).length!==256)return finish(new Error('head was downloaded twice'));if(context.TV_TORRENT.stats(result.id).cachedBytes>48*1024*1024)return finish(new Error('cache budget exceeded'));finish();});});});});},10);});});
