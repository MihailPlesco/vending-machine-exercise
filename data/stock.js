require( 'dotenv' ).config()
const crypto = require( 'crypto' )
const { resolve } = require('path')
module.exports = class dfbStock {
    #client
    #keyprefix
    static ERROR_PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND'
    static ERROR_PRODUCTS_SET_NOT_FOUND = 'PRODUCTS_SET_NOT_FOUND'
    static ERROR_STOCK_EMPTY = 'STOCK_EMPTY'

    constructor( client, keyprefix = 'stock:' ) {
        this.#client = client
        this.#keyprefix = process.env.REDIS_NSPREFIX + ':' + keyprefix
    }

    async newProduct( data ) {
        return new Promise( async ( resolve, reject ) => {
            var product_uid = crypto.randomUUID()
            var nrkey = this.#keyprefix + 'p:' + product_uid
            
            await this.#client.HSET( nrkey, 'seller_uid', data['seller_uid'] )
            await this.#client.HSET( nrkey, 'product_name', data['product_name'] )
            await this.#client.HSET( nrkey, 'cost', data['cost'] )
            await this.#client.HSET( nrkey, 'amount', data['amount'] )

            // add to seller's product set
            await this.#client.SADD( this.#keyprefix + data['seller_uid'], product_uid )

            resolve( product_uid )
        })
    }
    async updateProduct( data ) {
        return new Promise( async ( resolve, reject ) => {
            var product_uid = data['product_uid']
            var ukey = this.#keyprefix + 'p:' + product_uid
            
            // await this.#client.HSET( nrkey, 'product_name', data['product_name'] )
            ;( data['cost'] ) && await this.#client.HSET( ukey, 'cost', data['cost'] )
            ;( data['amount'] ) && await this.#client.HINCRBY( ukey, 'amount', data['amount'] )

            this.getProduct( product_uid )
            .then( ( iproduct ) => { resolve( iproduct )})
            .catch( ( err ) => { reject( err ) })
        })
    }
    async getStockSet( seller_uid ) {
        return new Promise( async ( resolve, reject ) => {
            var setkey = this.#keyprefix + seller_uid
            var sproduct_uids = await this.#client.SMEMBERS( setkey )
            if ( sproduct_uids ) {
                var sproducts = []
                var j = -1
                while ( ++j < sproduct_uids.length ) {
                    sproducts.push( await this.getProduct( sproduct_uids[ j ]) )
                }
                resolve( sproducts )
            }
            else {
                reject( dfbStock.ERROR_PRODUCTS_SET_NOT_FOUND )
            }
        })
    }

    async getStock( ) {
        return new Promise( async ( resolve, reject ) => {
            var pkeyprefix = this.#keyprefix + 'p:'
            var pkeys = await this.#client.KEYS( pkeyprefix + '*' )
            if ( pkeys ) {
                var products = []
                var j = -1, puid
                while ( ++j < pkeys.length ) {
                    puid = pkeys[ j ].replace(new RegExp(`^${pkeyprefix}`), '')
                    products.push( await this.getProduct( puid ) )
                }
                resolve( products )
            }
            else {
                reject( dfbStock.ERROR_STOCK_EMPTY )
            }
        })
    }

    async getProduct( product_uid ) {
        return new Promise( async ( resolve, reject ) => {
            var nrkey = this.#keyprefix + 'p:' + product_uid
            var iproduct = await this.#client.HGETALL( nrkey )
            if ( iproduct ) {
                iproduct['product_uid'] = product_uid
                resolve( iproduct )
            }
            else {
                reject( dfbStock.ERROR_PRODUCT_NOT_FOUND )
            }
        })
    }

    async buyProduct( iproduct, amount, user_uid ) {
        return new Promise( async ( resolve, reject ) => {
            var pkey = this.#keyprefix + 'p:' + iproduct['product_uid']
            var pcost = parseInt( iproduct['cost'] )
            var bamount = parseInt( amount )
            var udeposit = parseInt( await this.#client.HGET( this.dfb.users.keyprefix + user_uid, 'deposit' ))

            if ( udeposit >= pcost ) {
                var cart = 0, pamount_left
                do {
                    pamount_left = parseInt( await this.#client.HINCRBY( pkey, 'amount', -1 ) )
                    if ( pamount_left < 0 ) {
                        await this.#client.HINCRBY( pkey, 'amount', 1 )    
                    }
                    else {
                        cart++
                        udeposit -= pcost
                        bamount--
                    }
                } while ( (pamount_left > 0) && ( udeposit > 0 ) && ( bamount > 0 ) )
                if ( udeposit < 0 ) {
                    cart--
                    udeposit += pcost
                    bamount++
                    await this.#client.HINCRBY( pkey, 'amount', 1 )
                }

                await this.#client.HSET( this.dfb.users.keyprefix + user_uid, 'deposit', udeposit )

                var change = []
                var allowed_coins = [100,50,20,10,5]
                var j = -1
                while( ++j < allowed_coins.length ) {
                    while ( udeposit >= allowed_coins[ j ] ) {
                        change.push( allowed_coins[ j ] )
                        udeposit = udeposit - allowed_coins[ j ]
                    }
                }
                
                resolve( { "spent": cart * pcost, "change": change, "product_uid": iproduct['product_uid'], "amount": cart })
            }
            else {
                reject( 'INSUFFICIENT_DEPOSIT' )
            }
        })
    }
}