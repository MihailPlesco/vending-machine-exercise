const Worker = require('./Worker.js')

const _ts = () => { return new Date().getTime() }

module.exports = class UserWorker extends Worker {
    static valid_data_keys =  [ 'wsess_id', 'token', 'username', 'password', 'amount', 'product_uid', 'product_name', 'cost', 'req_id' ]
    static allowed_requests = [ '/auth', '/deposit', '/sell', '/buy' ]

    async getAuthToken( wsess_id ) {
        var max_waiting_time_ms = 1000

        return new Promise( async ( resolve, reject ) => {
            var token = null, failed = null, ts0 = _ts()
            var getTokenAttempt_timeout, getTokenAttempt = async () => {
                if ( token = await this.dfb.wsess.get( wsess_id, 'token' ) ) {
                    resolve( token )
                }
                else if ( failed = await this.dfb.wsess.get( wsess_id, 'failed' ) ) {
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

    async getReqStatus() {
        return await this.dfb.wsess.get( this.data['wsess_id'], 'req:' + this.data['req_id'] )
    }
}