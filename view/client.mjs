export class client {
    #wsess_id = ''
    #token    = ''
    #onauth   = {}
    #gateway_host
    
    constructor( gateway_host = document.location.protocol + '//' + document.location.host) {
        this.#gateway_host = gateway_host
        ;( this.#wsess_id = this.getCookie('wsess_id') ) && this.startSession( this.#wsess_id )
    }

    startSession( wsess_id ) {
        if ( wsess_id ) {
            this.setCookie('wsess_id', wsess_id)
        }
        this.getAuthToken()
        .then( ( resp ) => {
            if ( !resp['token'] ) {
                this.#resolve_onauth( false )
            }
            else {
                this.#token = resp['token']
                this.getMyProfile()
                .then( ( profile ) => {
                    profile.deposit = parseInt( profile.deposit )
                    this.profile = profile
                    this.#resolve_onauth( profile )
                })
                .catch( ( err ) => {
                    console.warn( err )
                })
            }
        })
        .catch( ( err ) => {
            console.warn( err )
        })
    }

    newUser( role, username, password ) {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/user', {
                'token': 'new_' + role,
                'username': username,
                'password': password,
                'wsess_id': this.#wsess_id
            }, respond, reject )
        })
    }
    authUser( role, username, password ) {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/user', {
                'token': role,
                'username': username,
                'password': password,
                'wsess_id': this.#wsess_id
            }, respond, reject )
        })
    }
    clearAuth() {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/user', {
                'token': 'del',
                'wsess_id': this.#wsess_id
            }, respond, reject )
        })
    }

    getAuthToken() {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/user', {
                'token': 'get',
                'wsess_id': this.#wsess_id
            }, respond, reject )
        })
    }
    getMyProfile() {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/profile', {
                'token': this.#token,
                'wsess_id': this.#wsess_id
            }, respond, reject )
        })
    }
    getMyProducts() {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/products', {
                'token': this.#token,
                'wsess_id': this.#wsess_id,
                'uid': this.profile.uid
            }, respond, reject )
        })
    }
    getProducts() {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/products', {
                'token': this.#token,
                'wsess_id': this.#wsess_id
            }, respond, reject )
        })
    }
    async deposit( amount ) {
        return new Promise( ( respond, reject ) => {
            if ( !parseInt( amount ) || ( amount % 5 != 0) ) {
                reject( 'BAD_AMOUNT' )
            }
            else {
                this.xhrpost( '/deposit', {
                    'token': this.#token,
                    'wsess_id': this.#wsess_id,
                    'amount': amount
                }, respond, reject )
            }
        })
    }
    async newProduct( product_name, product_cost, product_amount ) {
        if ( !product_name || !parseInt(product_cost) || !parseInt(product_amount) ) {
            reject( 'BAD_INPUT' )
        }
        else {
            return new Promise( ( respond, reject ) => {
                this.xhrpost( '/sell', {
                    'token': this.#token,
                    'wsess_id': this.#wsess_id,
                    'product_name': product_name,
                    'cost': product_cost,
                    'amount': product_amount
                }, respond, reject )
            })
        }
    }
    async buyProduct( product_uid, amount ) {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/buy', {
                'token': this.#token,
                'wsess_id': this.#wsess_id,
                'product_uid': product_uid,
                'amount': amount
            }, respond, reject )
        })
    }
    async updateProduct( product ) {
        return new Promise( ( respond, reject ) => {
            var p = {
                'token': this.#token,
                'wsess_id': this.#wsess_id,
                'product_uid': product['uid']
            }
            ;(product['product_name']) && (p['product_name'] = product['product_name'])
            ;(product['cost']) && (p['cost'] = product['cost'])
            ;(product['amount']) && (p['amount'] = product['amount'])
            this.xhrpost( '/sell', p, respond, reject )
        })
    }

    getReqStatus( req_id ) {
        return new Promise( ( respond, reject ) => {
            this.xhrpost( '/req_status', {
                'token': this.#token,
                'wsess_id': this.#wsess_id,
                'req_id': req_id
            }, respond, reject )
        })
    }

    async #resolve_onauth( resp ) {
        var okeys = Object.keys( this.#onauth )
        var j = -1
        while ( ++j < okeys.length ) this.#onauth[ okeys[ j ] ]( resp )
    }
    onauth( callback_name, callback ) {
        //FIXME
        this.#onauth[ callback_name ] = callback
    }

    xhrpost( endpoint, json, respond, reject ) {
        var xhr = new XMLHttpRequest()
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                respond( JSON.parse( xhr.responseText ) )
            }
            else {
                reject( xhr.status )
            }
        }
        xhr.open( 'POST', this.#gateway_host + endpoint )
        xhr.setRequestHeader( 'Content-Type', 'application/json' )
        xhr.send( JSON.stringify( json ) )
        return xhr
    }

    setCookie( cname, cvalue, exdays = 1 ) {
        const d = new Date()
        d.setTime( d.getTime() + ( exdays * 24 * 60 * 60 * 1000 ) )
        var expires = "expires=" + d.toUTCString()
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    
    delCookie( cname ) {
        this.setCookie( cname, '', 0 )
    }
    getCookie( cname ) {
        var name = cname + "="
        var ca = decodeURIComponent( document.cookie ).split( ';' )
        var j = -1, c
        while( ++j < ca.length ) {
            c = ca[ j ]
            while( c.charAt(0) == ' ' ) c = c.substring( 1 );
            if ( c.indexOf( name ) == 0 ) return c.substring( name.length, c.length )
        }
        return "";
    }
}