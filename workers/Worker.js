const DataFabrik = require('../data/fabrik.js')

module.exports = class Worker {
    data = null
    static valid_data_keys = []
    static allowed_requests = []
    static resolvers = {
        '/auth':    'GateKeeper',
        '/deposit': 'GateKeeper',
        '/sell':    'StockHandler',
        '/buy':     'StockHandler',
        _classes: {}
    }
    static resolve = {}
    #error_JSON_parse
    #error_validDataKeys

    static dfb = new DataFabrik()
    get dfb() { return this.constructor.dfb }

    constructor( data ) {

        return new Promise( ( resolve, reject ) => {            
            // --
            var dobj = data
            if ( (typeof(dobj) == 'object') || (dobj = this.JSON_parse( data )) ) {
                // -- validate data object keys
                if ( this.validDataKeys( dobj ) ) {
                    this.data = dobj
                    resolve( this )
                }
                else {
                    reject( this.#error_validDataKeys )
                }
                
            } else {
                reject ( this.#error_JSON_parse )
            }
        })
    }

    static async newResolver( data ) {
        return new Promise( ( promise_resolve, promise_reject ) => {   
            if ( data['_resolve'] && Worker.resolvers[ data['_resolve'] ] ) {

                if ( !Worker.resolvers._classes[ data['_resolve'] ] ) {
                    Worker.resolvers._classes[ data['_resolve'] ] = require( `./${Worker.resolvers[ data['_resolve'] ]}.js` )
                }
                new Worker.resolvers._classes[ data['_resolve'] ]( data )
                .then( ( worker ) => {
                    promise_resolve( worker )
                })
                .catch( ( err ) => {
                    promise_reject( err )
                })
            }
            else {
                promise_reject( `--no '${data['_resolve']}' assignments defined` )
            }
        })
    }

    async pushRequest( req_type ) {
        if ( this.constructor.allowed_requests.indexOf(req_type) >=0 )
        this.dfb.newRequest( 
            req_type,
            this.data, 
            () => { 
                Worker.newResolver( {"_resolve": req_type } )
                .then( ( worker ) => {
                    worker.doWork()
                })
                .catch( ( err ) => {
                    console.log(`${req_type} worker failed: `, err)
                })
            }
        )
    }

    async pullRequest( last_in_queue_callback ) {
        return await this.dfb.pullRequest( 
            this.data['_resolve'],
            last_in_queue_callback
        )
    }

    async doWork( ) {
        if ( this.data['_resolve'] ) {
            var _resolve_method_name = this.constructor.resolve[ this.data['_resolve'] ]
            if ( this[ _resolve_method_name ] ) {
                var item
                while ( item = await this.pullRequest( ) ) {
                    this[ _resolve_method_name ]( item )
                }
            }
        }
    }

    JSON_parse( data ) {
        try { 
            var dobj = JSON.parse( data )
            return dobj

        } catch ( err ) {
            this.#error_JSON_parse = err
            return false
        }
    }

    validDataKeys( dobj ) {
        var vdkeys = this.constructor.valid_data_keys,
            data_keys = Object.keys( dobj )

        var i = -1
        while ( ++i < data_keys.length ) {
            if ( vdkeys.indexOf( data_keys[i] ) == -1 ) {
                this.#error_validDataKeys = `data key '${data_keys[i]}' not allowed`
                return false
            }
        }
        return true
    }
}