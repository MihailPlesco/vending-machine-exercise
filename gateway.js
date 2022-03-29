#!/usr/bin/env node

const http = require('http');
const http_cookie = require('http.cookie')
const fs = require('fs')
const zlib = require('zlib')
const crypto = require('crypto')
const UserWorker = require('./workers/User.js')

const GATEWAY_PORT = 8000
const _ts = () => { return new Date().getTime() }
// --- extension => http content-type mime type ---
const MIME_TYPES = {
    'html': 'text/html',
    'mjs':  'application/javascript',
    'json': 'application/json',
    'css':  'text/plain'
}
// --- valid static request url regexp ---
const VS_REGEXP = new RegExp('\\.(' + Object.keys( MIME_TYPES ).join('|') + ')$')
// --- --- --- ---
const getMimeType = ( req_url ) => {
    var ext = req_url.substring( req_url.lastIndexOf('.') + 1 )
    return MIME_TYPES[ ext ]
}
// --- --- --- ---
const isValidStatic = ( req_url ) => req_url.match(/^\/view\//) && req_url.match( VS_REGEXP )
// --- --- --- ---
const isValidRoute = ( req_url ) => req_url.match(/^\/(user|deposit|sell|buy|req_status)$/)
// --- --- --- ---
const readRequestData = ( req ) => {
    return new Promise( ( resolve, reject ) => {
        var data = ''; 
        req
            .on(  'data', ( chunk ) => { data += chunk })
            .on( 'error',   ( err ) => { reject( err ) })
            .on(   'end',        () => { resolve( data ) })
    })
}
const respondNoContent = ( res ) => {
    res.writeHead( 204, 'No Content' )
    res.end()
}
// 401 Unauthorized
// 403 Forbidden
const endResponse = ( res, json = '{}' ) => {
    res.writeHead( 200, { 'Content-Type': 'application/json' } )
    res.end( json )
}

// --- the main gateway server ---
const gw_server = http.createServer( async (req, res) => {
    var cookie = new http_cookie( req, res )

    if ( isValidStatic( req.url ) ) 
    {// -- serve static files --
        res.writeHead( 200, { 
            'Content-Type': getMimeType( req.url ),
            'Content-Encoding': 'gzip'
        } )
        var _file = __dirname + req.url
        if ( fs.existsSync( _file ) ) {
            fs.createReadStream( _file ).pipe( zlib.createGzip() ).pipe( res )
        }
        else {
            respondNoContent( res )
        }
    }
    else if ( isValidRoute( req.url ))
    {// -- endpoints --
        
        // --- --- --- ---
        var _req_dataOkThen = ( data ) => {}
        var _req_dataErrorCatch = ( err ) => {
            console.log( err )
            respondNoContent( res )
        }
        // --- --- --- ---
        if      ( '/user'    == req.url ) {
        // ---
            _req_dataOkThen = ( data ) => {
                new UserWorker( data )
                .then( ( uw ) => {
                    //-- worker session_id
                    if ( !uw.data['wsess_id'] ) {
                        uw.data['wsess_id'] = cookie.get( 'wsess_id' ) || crypto.randomUUID()
                        cookie.set( 'wsess_id', uw.data['wsess_id'] )
                    }
                    
                    if ( uw.data['token'] == 'get' ) {
                        uw.getAuthToken( uw.data['wsess_id'] )
                        .then( ( token ) => {
                            endResponse( res, `{ "token": "${token}" }` )
                        })
                        .catch( ( err ) => {
                            var rkey = ( err == 'TIMEOUT' ? 'error' : 'failed' )
                            endResponse( res, `{ "${rkey}": "${err}" }` )
                        })
                    }
                    else {
                        endResponse( res, `{ "wsess_id": "${uw.data['wsess_id']}" }` )
                        uw.pushRequest( '/auth' )
                    }
                })
                .catch( ( err ) => {
                    endResponse( res, `{ "error": "${err}" }` )
                }) 
            }
        }
        else if ( [ '/deposit', '/sell', '/buy', '/req_status' ].indexOf(req.url) >= 0 ) {
        // ---
            _req_dataOkThen = ( data ) => {
                var _unauthorizedErrorResponse = ( ) => { endResponse( res, `{ "error": "UNAUTHORIZED" }` ) }
                new UserWorker( data )
                    .then( ( uw ) => {
                        uw.data['wsess_id'] = uw.data['wsess_id'] || cookie.get( 'wsess_id' )

                        if ( '/req_status' == req.url ) {
                            uw.getAuthToken( uw.data['wsess_id'] )
                            .then( async ( token ) => {
                                if ( token == uw.data['token'] ) {
                                    var req_status = await uw.getReqStatus( )
                                    if ( req_status ) {
                                        endResponse( res, req_status )
                                    }
                                    else {
                                        endResponse( res, '{"error": "status unavailable"}')
                                    }
                                }
                                else {
                                    _unauthorizedErrorResponse()
                                }
                            })
                            .catch( ( err ) => {
                                endResponse( res, `{ "error": "${err}" }` )
                                // _unauthorizedErrorResponse()
                            })
                        }
                        else {
                            uw.data['req_id'] = _ts() + '.' + crypto.randomUUID()
                            
                            if ( uw.data['wsess_id'] && uw.data['token'] ) {
                                endResponse( res, `{ "req_id": "${uw.data['req_id']}" }` )
                                uw.pushRequest( req.url )
                            }
                            else {
                                _unauthorizedErrorResponse()
                                //respondNoContent( res )
                            }
                        }
                    })
                    .catch( ( err ) => {
                        endResponse( res, `{ "error": "${err}" }` )
                    }) 
            }
        }
    
        // --- --- --- ---
        readRequestData( req )
            .then( ( data ) => { _req_dataOkThen( data ) })
            .catch( ( err ) => { _req_dataErrorCatch( err ) })

    }
    else {
        respondNoContent( res )       
    }
});

gw_server.on( 'clientError', ( err, socket ) => socket.end( 'HTTP/1.1 400 Bad Request\r\n\r\n' ) )

console.log( 'gateway server listening on port %s', GATEWAY_PORT )
gw_server.listen( GATEWAY_PORT )