const Worker = require('./Worker.js')

module.exports = class StockHandler extends Worker{
    static valid_data_keys = [ '_resolve' ]
    static ERROR_SELL_SELLERS_ONLY = 'SELL_SELLERS_ONLY'
    static ERROR_WRONG_COST = 'WRONG_COST'
    static ERROR_EMPTY_STOCK = 'EMPTY_STOCK'
    static resolve = {
        '/sell': 'resolveSellRequest',
        '/buy':  'resolveBuyRequest'
    }

    async resolveSellRequest( item ) {
        if ( item['token'] == await this.dfb.wsess.get( item['wsess_id'], 'token' )) {
            this.dfb.users.getAuthByToken( item['token'] )
            .then( async ( iauth ) => {
                var dcost = parseInt( item['cost'] )
                var req_status = { }
                if ( !iauth.user_uid.match(/^seller_/) ) {
                    req_status['failed'] = StockHandler.ERROR_SELL_SELLERS_ONLY
                }
                else if ( dcost % 5 != 0 ) {
                    req_status['failed'] = StockHandler.ERROR_WRONG_COST
                }
                else {
                    await this.dfb.stock.newProduct( { 
                        "product_name": item['product_name'],
                        "seller_uid":    iauth.user_uid,
                        "cost":         item['cost'], 
                        "amount":       item['amount'] } )
                    .then( ( product_uid ) => {
                        req_status['success'] = product_uid
                    })
                    .catch( ( err ) => {
                        req_status['failed'] = err
                    })
                }
                this.dfb.wsess.setReqStatus( item, req_status )
            })
            .catch( ( err ) => {
                this.dfb.wsess.setReqStatus( item, {'failed': 'unauthorized'} )
            })
        }
    }

    async resolveBuyRequest( item ) {
        if ( item['token'] == await this.dfb.wsess.get( item['wsess_id'], 'token' )) {
            this.dfb.users.getAuthByToken( item['token'] )
            .then( async ( iauth ) => {
                var dcost = parseInt( item['cost'] )
                var req_status = { }
                if ( !iauth.user_uid.match(/^buyer_/) ) {
                    req_status['failed'] = StockHandler.ERROR_BUY_BUYERS_ONLY
                }
                else {
                    await this.dfb.stock.getProduct( item['product_uid'] ) 
                    .then( async ( iproduct ) => {
                        if ( parseInt( iproduct['amount'] ) > 0 ) {
                            await this.dfb.stock.buyProduct( iproduct, item['amount'], iauth.user_uid )
                            .then( ( buy_resp ) => {
                                req_status['success'] = buy_resp
                            })
                            .catch( ( err ) => {
                                req_status['failed'] = err    
                            })
                        }
                        else {
                            req_status['failed'] = StockHandler.ERROR_EMPTY_STOCK
                        }
                    })
                    .catch( ( err ) => {
                        req_status['failed'] = err
                    })
                }
                this.dfb.wsess.setReqStatus( item, req_status )
            })
            .catch( ( err ) => {
                this.dfb.wsess.setReqStatus( item, {'failed': 'unauthorized'} )
            })
        }
        else {
            console.log( item )
        }
    }

}