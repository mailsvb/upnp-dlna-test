const ssdp = require('node-ssdp').Client;
const ssdp_client = new ssdp({});
const upnp_client = require('upnp-device-client');
const MediaRendererClient = require('upnp-mediarenderer-client');

const manufacturer = 'Libratone';
let found = false;

ssdp_client.on('notify', function () {
  //console.log('Got a notification.')
})

ssdp_client.on('response', function inResponse(headers, code, rinfo) {
    if (headers instanceof Object && headers.LOCATION) {
        console.log(headers);
        let new_upnp_client = new upnp_client(headers.LOCATION);
        new_upnp_client.getDeviceDescription(function(err, description) {
            if (description instanceof Object && description.manufacturer && description.manufacturer == manufacturer) {
                /*
                let my_client = new MediaRendererClient(headers.LOCATION);
                let options = { 
                    autoplay: true,
                    contentType: 'audio/mp3',
                        metadata: {
                            type: 'audio', // can be 'video', 'audio' or 'image'
                    }
                };
                my_client.load('http://1live-diggi.akacast.akamaistream.net/7/965/119435/v1/gnl.akacast.akamaistream.net/1live-diggi', options, function(err, result) {
                    if(err) throw err;
                    console.log('playing ...');
                });
                */
            }
            console.log(description);
            ssdp_client.stop();
        });
        
        
    }
})

setInterval(() => {
    ssdp_client.search("urn:schemas-upnp-org:device:MediaRenderer:1");
}, 2000);
