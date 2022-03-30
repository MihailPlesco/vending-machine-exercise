module.exports = class dfbWsess {
    #client
    #keyprefix
    
    constructor ( client, keyprefix = 'wsess:' ) {
        this.#client = client
        this.#keyprefix = 'dfb:' + keyprefix
    }

    async set( wsess_id, key, value ) {
        this.#client.HSET( this.#keyprefix + wsess_id, key, value )
    }

    async del( wsess_id, key ) {
        this.#client.HDEL( this.#keyprefix + wsess_id, key )
    }

    async get( wsess_id, key ) {
        if ( key == undefined ) {
            return await this.#client.HGETALL( this.#keyprefix + wsess_id )
        } else {
            return await this.#client.HGET( this.#keyprefix + wsess_id, key )
        }
    }

    setReqStatus( item, req_status = {} ) {
        this.set( item['wsess_id'], `req:${item['req_id']}`, JSON.stringify( req_status ) )
    }
}