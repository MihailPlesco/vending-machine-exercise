const crypto = require( 'crypto' )

const _ts = () => { return new Date().getTime() }

module.exports = class dfbUsers {
    #client
    #keyprefix
    #auths_keyprefix
    
    static ERROR_DUPLICATE_USERNAME = 'DUPLICATE_USERNAME'

    get keyprefix() { return this.#keyprefix }
    
    constructor ( client, keyprefix = 'user:', auths_keyprefix = 'dfb:auth:' ) {
        this.#client = client
        this.#keyprefix = 'dfb:' + keyprefix
        this.#auths_keyprefix = auths_keyprefix
    }

    validPassword( iuser, password ) {
        var hash = crypto.pbkdf2Sync( password, iuser['salt'], 1024, 64, 'sha512' ).toString( 'hex' )
        return hash === iuser['hash']
    }

    getPasswordSaltHash( password ) {
        var salt = crypto.randomBytes( 16 ).toString( 'hex' )
        var hash = crypto.pbkdf2Sync( password, salt, 1024, 64, 'sha512' ).toString( 'hex' )
        return { "salt": salt, "hash": hash }
    }

    async new( data ) {
        return new Promise( async ( resolve, reject ) => {
            var nrkey = this.#keyprefix + data['uid']
            var new_record_attempt = await this.#client.HSETNX( nrkey, 'username', data['username'] )
            if ( new_record_attempt ) {
                var pass_sh = this.getPasswordSaltHash( data['password'] )
                await this.#client.HSET( nrkey, 'uid', data['uid'] )
                await this.#client.HSET( nrkey, 'salt', pass_sh.salt )
                await this.#client.HSET( nrkey, 'hash', pass_sh.hash )
                await this.#client.HSET( nrkey, 'role', data['role'] )
                await this.#client.HSET( nrkey, 'deposit', data['deposit'] )

                resolve( await this.newAuth( data['uid'] ) )
            } else {
                reject( dfbUsers.ERROR_DUPLICATE_USERNAME )
            }
        })
    }
    
    async getByUid( user_uid ) {
        return new Promise( async ( resolve, reject ) => {
            var iuser = await this.#client.HGETALL( this.#keyprefix + user_uid )
            if ( iuser['uid'] ) {
                resolve ( iuser )
            } else {
                reject( `--${user_uid} user not found` )
            }
        })
    }

    async deposit( user_uid, amount ) {
        this.#client.HINCRBY( this.#keyprefix + user_uid, 'deposit', amount )
    }

    async newAuth( user_uid ) {
        var token = crypto.randomUUID()
        var auth_key = this.#auths_keyprefix + token
        var timestamp = _ts()
        await this.#client.HSET( auth_key, 'token', token )
        await this.#client.HSET( auth_key, 'user_uid', user_uid )
        await this.#client.HSET( auth_key, 'timestamp', timestamp )

        return { 'token': token, 'user_uid': user_uid, 'timestamp': timestamp }
    }

    getAuthByToken( token ) {
        return new Promise( async ( resolve, reject ) => {
            var iauth = await this.#client.HGETALL( this.#auths_keyprefix + token )
            if ( iauth['token'] ) {
                resolve ( iauth )
            } else {
                reject()
            }
        })
    }

    getProfile( token ) {
        return new Promise( ( resolve, reject ) => {
            this.getAuthByToken( token )
            .then( async ( iauth ) => {
                var iuser = await this.#client.HGETALL( this.#keyprefix + iauth['user_uid'] )
                delete iuser['salt']
                delete iuser['hash']
                resolve( iuser )
            })
            .catch( ( err ) => {
                reject( err )
            })
        })
    }
}