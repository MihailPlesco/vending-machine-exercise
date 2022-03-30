const Worker = require('./Worker.js')

const _ts = () => { return new Date().getTime() }

module.exports = class UserWorker extends Worker {
    static valid_data_keys =  [ 'wsess_id', 'token', 'uid', 'username', 'password', 'amount', 'product_uid', 'product_name', 'cost', 'req_id' ]
    static allowed_requests = [ '/auth', '/deposit', '/sell', '/buy' ]

    async getAuthToken( ) {
        var max_waiting_time_ms = 1000

        return new Promise( async ( resolve, reject ) => {
            var token = null, failed = null, ts0 = _ts()
            var getTokenAttempt_timeout, getTokenAttempt = async () => {
                if ( token = await this.dfb.wsess.get( this.data['wsess_id'], 'token' ) ) {
                    resolve( token )
                }
                else if ( failed = await this.dfb.wsess.get( this.data['wsess_id'], 'failed' ) ) {
                    this.dfb.wsess.del( this.data['wsess_id'], 'failed' )
                    reject( failed )
                }
                else if ( _ts() - ts0 > max_waiting_time_ms ) {
                    reject( 'TIMEOUT' )
                }
                else {
                    getTokenAttempt_timeout = setTimeout( getTokenAttempt, Math.round( max_waiting_time_ms / 2 ) )
                }
            }
            getTokenAttempt()
        })
    }

    async delAuthToken( ) {
        this.dfb.wsess.del( this.data['wsess_id'], 'token' )
        this.dfb.wsess.del( this.data['wsess_id'], 'failed' )
    }

    async getProfile() {
        return this.dfb.users.getProfile( this.data['token'] )
    }

    async getMyProducts() {
        return this.dfb.stock.getStockSet( this.data['uid'] )
    }

    async getReqStatus() {
        return await this.dfb.wsess.get( this.data['wsess_id'], 'req:' + this.data['req_id'] )
    }
}