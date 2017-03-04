const fs            = require('fs');
const ssdp          = require('node-ssdp').Client;
const ssdp_client   = new ssdp({});
const upnp_client   = require('upnp-device-client');
const browseServer  = require('dlna-browser-utils');

const folder        = 'Video';
const friendlyName  = 'NAS';
let init            = false;
let foundFolder     = false;
let folderCount     = 0;
let parents         = {};
let finalResult     = '';
let URL;

const Scan = function (id) {
    browseServer(id, URL, {}, (err, result) => {
        if (err) {
            return err;
        }
        List(result);
    });
}

const List = function(result) {
    if (foundFolder && folderCount > 0)    { folderCount -= 1; }
    if (foundFolder && result.container)   { folderCount += result.container.length; }
    
    if (result.item && foundFolder) {
        for (let i = 0; i < result.item.length; i++) {
            finalResult += `<a href="${result.item[i].res}" target="_blank">${parents[result.item[i].parentID]}/${result.item[i].title}</a><br>\n`;
        }
    }
    if (result.container) {
        for (let i = 0; i < result.container.length; i++) {
            //console.log('C: ' + result.container[i].title);
            if (foundFolder) {
                parents[result.container[i].id] = parents[result.container[i].parentID] + '/' + result.container[i].title;
                Scan(result.container[i].id);
            }
            else {
                if (result.container[i].title == folder) {
                    foundFolder = true;
                    parents[result.container[i].id] = result.container[i].title;
                    Scan(result.container[i].id);
                    break;
                }
                
            }
        }
    }
    if (foundFolder && folderCount <= 0) {
        fs.writeFileSync('index.html', finalResult);
        console.log(finalResult);
    }
}

ssdp_client.on('response', function inResponse(headers, code, rinfo) {
    (code !== 200) ? console.error(rinfo) : console.log(headers);
    if (headers instanceof Object && headers.LOCATION) {
        let new_upnp_client = new upnp_client(headers.LOCATION);
        new_upnp_client.getDeviceDescription((err, description) => {
            (err) ? console.error(err) : console.log(description);
            if ( description instanceof Object && 
                 (description.friendlyName && description.friendlyName == friendlyName) &&
                 (description.services)
                )
            {
                if (!init) {
                    ssdp_client.stop();
                    init = true;
                    URL = description.services['urn:upnp-org:serviceId:ContentDirectory'].controlURL;
                    Scan('0');
                }
            }
        });
    }
})

let searchInterval = setInterval(() => {
    if (init) {
        clearInterval(searchInterval);
    }
    ssdp_client.search("urn:schemas-upnp-org:device:MediaServer:1");
}, 2000);
