const Worker = require('./Worker.js')

module.exports = class GateKeeper extends Worker {
    static valid_data_keys = [ '_resolve' ]
    static valid_deposit_amounts = [5, 10, 20, 50, 100]
    static ERROR_WRONG_AMOUNT = 'WRONG_AMOUNT'
    static ERROR_INVALID_ROLE_USERNAME = 'INVALID_ROLE_USERNAME'
    static ERROR_INVALID_PASSWORD = 'INVALID_PASSWORD'
    static ERROR_DEPOSIT_BUYERS_ONLY = 'DEPOSIT_BUYERS_ONLY'

    static resolve = {
        '/auth':    'resolveAuthRequest',
        '/deposit': 'resolveDepositRequest'
    }

    resolveAuthRequest( item ) {
        // -- new BUYER/SELLER -----------------------
        if ( item['token'] == 'new_buyer' || item['token'] == 'new_seller' ) {
            var role = item['token'].replace(/^new_/,'')
            this.dfb.users.new( { 
                "uid":      `${role}_${item['username']}`, 
                "username": item['username'], 
                "password": item['password'], 
                "role":     role, 
                "deposit":  0 } )
            .then( ( iauth ) => {
                this.dfb.wsess.set( item['wsess_id'], 'token', iauth['token'] )
            })
            .catch( ( err ) => {
                this.dfb.wsess.set( item['wsess_id'], 'failed', err )
            })
        }
        // -- new LOGIN -----------------------
        else if ( item['token'] == 'buyer' || item['token'] == 'seller' ) {
            this.dfb.users.getByUid( `${item['token']}_${item['username']}` )
            .then( async ( iuser ) => {
                if ( this.dfb.users.validPassword( iuser, item['password'] ) ) {
                    var iauth = await this.dfb.users.newAuth( iuser['uid'] )
                    this.dfb.wsess.set( item['wsess_id'], 'token', iauth['token'] )
                } else {
                    this.dfb.wsess.set( item['wsess_id'], 'failed', GateKeeper.ERROR_INVALID_PASSWORD )
                }                    
            })
            .catch( ( err ) => {
                this.dfb.wsess.set( item['wsess_id'], 'failed', GateKeeper.ERROR_INVALID_ROLE_USERNAME )
            })
        }
    }

    async resolveDepositRequest( item ) {
        if ( item['token'] == await this.dfb.wsess.get( item['wsess_id'], 'token' )) {
            this.dfb.users.getAuthByToken( item['token'] )
            .then( ( iauth ) => {
                var damount = parseInt( item['amount'] )
                var req_status = { }
                if ( !iauth.user_uid.match(/^buyer_/) ) {
                    req_status['failed'] = GateKeeper.ERROR_DEPOSIT_BUYERS_ONLY
                }
                else if ( GateKeeper.valid_deposit_amounts.indexOf( damount ) < 0 ) {
                    req_status['failed'] = GateKeeper.ERROR_WRONG_AMOUNT
                }
                else {
                    this.dfb.users.deposit( iauth.user_uid, damount )
                    req_status['success'] = `deposit: +${damount}`
                }
                this.dfb.wsess.setReqStatus( item, req_status )
            })
            .catch( ( err ) => {
                this.dfb.wsess.setReqStatus( item, {'failed': 'unauthorized'} )
            })
        }
    }
}