require( 'dotenv' ).config()
const redis = require( 'redis' )

const dfbUsers = require( './users.js' )
const dfbWsess = require( './wsess.js' )
const dfbStock = require( './stock.js' )
const fifo = require( './fifo.js' )

module.exports = class DataFabrik {
    #client
    #keyprefix
    #dfbUsers
    #dfbWsess
    #dfbStock

    get wsess () { return this.#dfbWsess || ( this.#dfbWsess = new dfbWsess( this.#client ) ) }
    get users () { return this.#dfbUsers || ( this.#dfbUsers = new dfbUsers( this.#client ) ) }
    get stock () { 
        if ( !this.#dfbStock ) {
            this.#dfbStock = new dfbStock( this.#client )
            this.#dfbStock.dfb = this
        }
        return this.#dfbStock
    }

    constructor( dnamespace = process.env.REDIS_NSPREFIX ) {
        this.#keyprefix = dnamespace + ':'
        this.#client = redis.createClient({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            prefix: this.#keyprefix
        })
        this.#client.connect().then(() => {
            this.purgeData()
        }).catch((err) => {
            console.log( err )
        })
    }
    async purgeData() {
        var keys = await this.#client.KEYS( this.#keyprefix + '*' )
        var i = -1
        while( ++i < keys.length ) {
            await this.#client.DEL( keys[ i ] )
            console.log( `DataFabrik.purgeData - ${keys[ i ]} deleted`)
        }
    }

    async newRequest( req_type, data, first_in_queue_callback ) {
        new fifo( 
            this.#client,
            req_type + ':',
            first_in_queue_callback,
            undefined
        )
        .push( data )
    }

    async pullRequest( req_type, last_in_queue_callback ) {
        return await new fifo( 
            this.#client,
            req_type + ':',
            undefined,
            last_in_queue_callback
        )
        .unshift( )
    }
}
