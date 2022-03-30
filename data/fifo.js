module.exports = class fifo {
    #client
    #keyprefix
    #lock_key
    #first_in_queue_callback
    #last_in_queue_callback

    constructor( client, keyprefix = 'fifo:', first_in_queue_callback, last_in_queue_callback ) {
        this.#client = client
        this.#keyprefix = process.env.REDIS_NSPREFIX + ':' + keyprefix
        this.#lock_key = this.#keyprefix + 'LOCK'
        this.#first_in_queue_callback = first_in_queue_callback
        this.#last_in_queue_callback = last_in_queue_callback
    }

    async push( item ) {
        while ( await this.#client.GET( this.#lock_key ) > 0 ) { /* wait */ }

        var last_item_index = await this.#client.INCR( this.#keyprefix + 'right' )

        var item_key = this.#keyprefix + 'item:' + last_item_index
        var i = -1, ikeys = Object.keys( item )
        while ( ++i < ikeys.length ) {
            await this.#client.HSET( item_key, ikeys[i], item[ ikeys[i] ] )
        }
        // -- first in queue
        ;( (last_item_index == 1) && this.#first_in_queue_callback ) && this.#first_in_queue_callback()
    }
    
    async unshift( ) {
        while ( await this.#client.GET( this.#lock_key ) > 0 ) { /* wait */ }

        // -- lock fifo
        await this.#client.INCR( this.#lock_key )

        // -- item's key (holder) left/right
        var ikeyl = this.#keyprefix + 'left',
            ikeyr = this.#keyprefix + 'right'

        // -- item's key (holder) next value, left
        var ikvl = await this.#client.INCR( ikeyl )

        var ikvr = await this.#client.GET( ikeyr )

        var item, item_key = this.#keyprefix + 'item:' + ikvl

        // -- all good – unlock fifo
        if ( ikvl < ikvr ) {
            this.#client.DECR( this.#lock_key )
            item = await this.#client.HGETALL( item_key )
        }
        // -- no queue or last in queue
        else if ( ikvl >= ikvr ) {
            await this.#client.SET( ikeyl, 0 )

            // -- no queue
            if ( ikvl > ikvr ) {
                this.#client.DECR( this.#lock_key )
                return null
            }
            // -- last item in queue
            else {
                await this.#client.SET( ikeyr, 0 )
                item = await this.#client.HGETALL( item_key )
                this.#client.DECR( this.#lock_key )
                ;( this.#last_in_queue_callback ) && this.#last_in_queue_callback( item )
            }
        }

        return item
    }
}