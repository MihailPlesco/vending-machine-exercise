import { client } from './client.mjs'



var _el = ( el_id ) => { return document.getElementById( el_id ) }
var _qs = ( s, el = document ) => { return Array.prototype.slice.call( el.querySelectorAll( s ) )}
var c = new client()
c.onauth('switch_frame', ( user ) => {
    var uframe = 'auth'
    if ( user ) {
        if ( user.role == 'buyer' ) {
            uframe = 'deposit'
            _qs( '.greeting', _el('frame_deposit'))[0].innerHTML = `Hello <span class="name">${user.username}</span>, enjoy your time!`
            _el( 'deposit_available' ).textContent = user.deposit
        }
        else {
            uframe = 'sell'
            _qs( '.greeting', _el('frame_sell'))[0].innerHTML = `Hello <span class="name">${user.username}</span>, what do you have?`
            updateMyProductsList()
        }
        _el('exit').className = ''
    }
    else {
        _el('exit').className = '_hidden'
    }
    _el('view_body').className = 'frame_' + uframe
})


var createAccount = () => {
    var username = _el('user_username').value,
        password = _el('user_password').value,
        role = (_el('user_role_buyer').checked ? 'buyer' : 'seller')

    if ( username && password ) {
        c.authNew( role, username, password )
        .then( ( resp ) => {
            c.start( resp['wsess_id'] )
        })
        .catch( ( err ) => {
            console.warn( err )
        })
    }
}
var loginAccount = () => {
    var username = _el('user_username').value,
        password = _el('user_password').value,
        role = (_el('user_role_buyer').checked ? 'buyer' : 'seller')

    if ( username && password ) {
        c.authGet( role, username, password )
        .then( ( resp ) => {
            c.start( resp['wsess_id'] )
        })
        .catch( ( err ) => {
            console.warn( err )
        })
    }
}
_el( 'user_auth_get' ).addEventListener( 'click', loginAccount )
_el( 'user_auth_new' ).addEventListener( 'click', createAccount )
_el( 'user_password').addEventListener( 'keydown', ( evt ) => {
    ;( evt.code == 'Enter' ) && loginAccount()
})
_el( 'exit' ).addEventListener( 'mousedown', ( evt ) => { 
    c.clearAuth()
    .then( () => {
        c.start()
    })
    .catch( ( err ) => {
        console.warn( err )
    })
})

var depositCoin = ( amount ) => {
    c.deposit( amount )
    .then(( resp ) => {
        if ( resp['req_id'] ) {
            setTimeout(()=>{
                c.getReqStatus( resp['req_id'] )
                .then( ( resp ) => {
                    if ( resp['success'] ) {
                        c.profile.deposit += parseInt( amount )
                        _el( 'deposit_available' ).textContent = c.profile.deposit
                        _el('deposit_amount').value = ''
                    }
                    else {
                        console.warn( resp )
                    }
                })
                .catch( ( resp ) => {
                    console.warn( resp )
                })
            }, 100)
        }
    })
    .catch( ( resp ) => {
        console.warn( resp )
    })
}

var updateMyProductsList = () => {
    c.getMyProducts()
    .then( ( products ) => {
        var j = -1;
        var plist = document.createDocumentFragment(), pitem
        while( ++j < products.length ) {
            pitem = document.createElement('div')
            pitem.innerHTML = `<span data-add="10" data-uid="${products[j]['product_uid']}">[+10]</span> - ${products[j]['product_name']} ( x ${products[j]['amount']} ) - \$${products[j]['cost']}` 
            plist.appendChild( pitem )
        }
        _el( 'my_products' ).innerHTML = ''
        _el( 'my_products' ).appendChild( plist )
    })
    .catch( ( err ) => {
        console.warn( err )
    })
}
_el( 'my_products' ).addEventListener( 'click', ( evt ) => {
    var a
    if ( a = parseInt( evt.target.getAttribute( 'data-add' ) ) ) {
        c.productUpdate( { 'uid': evt.target.getAttribute( 'data-uid' ), 'amount': a } )
        .then( ( resp ) => {
            if ( resp['req_id'] ) {
                setTimeout(()=>{
                    c.getReqStatus( resp['req_id'] )
                    .then( ( resp ) => {
                        if ( resp['success'] ) {
                            updateMyProductsList()
                        }
                        else {
                            console.warn( resp )
                        }
                    })
                    .catch( ( resp ) => {
                        console.warn( resp )
                    })
                }, 100)
            }
        })
        .catch( ( err ) => {
            console.warn( err )
        })
    }
})

_el( 'coins' ).addEventListener( 'mousedown', ( evt ) => {
    var val
    if (val = evt.target.getAttribute('data-val')) {
        
        evt.target.className = 'active'
        setTimeout( ( evtarget ) => { evtarget.className = '' }, 100, evt.target )
        depositCoin( val )

    }
})

_el( 'insert_deposit_amount' ).addEventListener( 'mousedown', () => {
    var val = _el('deposit_amount').value
    if ( val ) {
        depositCoin( parseInt( val ) )
    }
})

_el( 'product_new' ).addEventListener( 'click', () => { newProduct() })
_el( 'product_amount').addEventListener( 'keydown', ( evt ) => {
    ;( evt.code == 'Enter' ) && newProduct()
})

var newProduct = () => {
    c.productNew({
        'name':   _el('product_name').value,
        'cost':   parseInt( _el('product_cost').value ),
        'amount': parseInt( _el('product_amount').value )
    })
    .then( ( resp ) => {
        if ( resp['req_id'] ) {
            setTimeout(()=>{
                c.getReqStatus( resp['req_id'] )
                .then( ( resp ) => {
                    console.log( resp )
                    if ( resp['success'] ) {
                        _el( 'product_name').value = ''
                        _el( 'product_cost').value = ''
                        _el( 'product_amount').value = ''
                        updateMyProductsList()
                    }
                    else {
                        console.warn( resp )
                    }
                })
                .catch( ( resp ) => {
                    console.warn( resp )
                })
            }, 100)
        }
    })
    .catch( ( resp ) => {
        console.warn( resp )
    } )
}