import { client } from './client.mjs'

var c = new client()

var _el = ( el_id ) => { return document.getElementById( el_id ) }
var _qs = ( s, el = document ) => { return Array.prototype.slice.call( el.querySelectorAll( s ) )}

// ============================
var vTask = {
// -------
    'USER.signup': ( role, username, password ) => {
        if ( username && password ) {
            c.newUser( role, username, password )
            .then( ( resp ) => {
                c.startSession( resp['wsess_id'] )
            })
            .catch( ( err ) => {
                console.warn( err )
            })
        }

    },
// -------
    'USER.signin': ( role, username, password ) => {
        if ( username && password ) {
            c.authUser( role, username, password )
            .then( ( resp ) => {
                c.startSession( resp['wsess_id'] )
            })
            .catch( ( err ) => {
                console.warn( err )
            })
        }
    },
// -------
    'USER.signout': () => { 
        c.clearAuth()
        .then( () => {
            c.startSession()
        })
        .catch( ( err ) => {
            console.warn( err )
        })
    },
// -------
    'BUYER.deposit': ( amount ) => {
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
                            if ( c.profile.deposit > 0 ) {
                                _el('buy_products').className = 'button'
                            }
                            else {
                                _el('buy_products').className = 'button _hidden'
                            }
                
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
    },
// -------
    'BUYER.buy_product': ( uid, amount ) => {
        c.buyProduct( uid, amount )
        .then( ( resp ) => {
            if ( resp['req_id'] ) {
                setTimeout(()=>{
                    c.getReqStatus( resp['req_id'] )
                    .then( ( resp ) => {
                        if ( resp['success'] ) {
                            vTask['BUYER.products_can_buy.refresh']()
                            var p = resp['success']
                            c.profile.deposit -= parseInt( p['spent'] )
                            _el( 'deposit_left' ).textContent = c.profile.deposit
                            _el( 'deposit_available' ).textContent = c.profile.deposit
    
                            var pitem = document.createElement('div')
                            pitem.innerHTML = `<span>${p['amount']} x ${p['product_uid']}</span><div>change: ${JSON.stringify(p['change'])} total spent: \$${p['spent']}</div>` 
                            _el( 'purchased' ).insertBefore( pitem, _el( 'purchased' ).firstChild )
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
    },
// -------
    'BUYER.products_can_buy.refresh': () => {
        c.getProducts()
        .then( ( products ) => {
            var j = -1;
            var plist = document.createDocumentFragment(), pitem
            while( ++j < products.length ) {
                pitem = document.createElement('div')
                pitem.innerHTML = `<span class="name" data-rel="buy" data-amount="1" data-uid="${products[j]['product_uid']}" data-listen-mousedown-target="products">[buy] ${products[j]['product_name']}</span> ( ${products[j]['amount']} in stock ) - \$${products[j]['cost']}` 
                plist.appendChild( pitem )
            }
            _el( 'products' ).innerHTML = ''
            _el( 'products' ).appendChild( plist )
            _el( 'deposit_left' ).textContent = c.profile.deposit
        })
        .catch( ( err ) => {
            console.warn( err )
        })    
    },
// -------
    'SELLER.sell_product': ( name, cost, amount ) => {
        c.newProduct( name, cost, amount )
        .then( ( resp ) => {
            if ( resp['req_id'] ) {
                setTimeout(()=>{
                    c.getReqStatus( resp['req_id'] )
                    .then( ( resp ) => {
                        if ( resp['success'] ) {
                            _el( 'product_name').value = ''
                            _el( 'product_cost').value = ''
                            _el( 'product_amount').value = ''
                            _el( 'product_name').focus()
                            vTask['SELLER.products_in_stock.refresh']()
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
    },
// -------
    'SELLER.products_in_stock.refresh': () => {
        c.getMyProducts()
        .then( ( products ) => {
            var j = -1;
            var plist = document.createDocumentFragment(), pitem
            while( ++j < products.length ) {
                pitem = document.createElement('div')
                pitem.innerHTML = `<span data-add="10" data-uid="${products[j]['product_uid']}" data-listen-mousedown-target="my_products">[+10]</span> - <span class="name">${products[j]['product_name']}</span> ( x ${products[j]['amount']} ) - \$${products[j]['cost']}` 
                plist.appendChild( pitem )
            }
            _el( 'my_products' ).innerHTML = ''
            _el( 'my_products' ).appendChild( plist )
        })
        .catch( ( err ) => {
            console.warn( err )
        })
    },
// -------
    'VIEW.set_frame': ( name ) => { _el('view_body').className = `frame_${name}` },
}

// ============================
var onEvent = {
// -------
    'CLIENT.auth': ( user ) => {
        var uframe = 'auth'
        if ( user ) {
            if ( user.role == 'buyer' ) {
                uframe = 'deposit'
                _qs( '.greeting', _el('frame_deposit'))[0].innerHTML = `Hello <span class="name">${user.username}</span>, enjoy your time!`
                _qs( '.greeting', _el('frame_buy'))[0].innerHTML = `Hello <span class="name">${user.username}</span>, make your choices!`
                _el( 'deposit_available' ).textContent = user.deposit
                if ( user.deposit > 0 ) {
                    _el('buy_products').className = 'button'
                }
                else {
                    _el('buy_products').className = 'button _hidden'
                }
            }
            else {
                uframe = 'sell'
                _qs( '.greeting', _el('frame_sell'))[0].innerHTML = `Hello <span class="name">${user.username}</span>, what do you have?`
                vTask['SELLER.products_in_stock.refresh']()
            }
            _el('exit').className = ''
        }
        else {
            _el('exit').className = '_hidden'
        }
    
        vTask['VIEW.set_frame']( uframe )
    },
// -------
    'BUYER.depositupdate': ( amount ) => {

    },
// -------
    'VIEW.mousedown': {
        // -------
        'user_auth_get': () => {
            vTask['USER.signin']( 
                _el('user_role_buyer').checked ? 'buyer' : 'seller',
                _el('user_username').value,
                _el('user_password').value
            )
        },
        // -------
        'user_auth_new': () => {
            vTask['USER.signup']( 
                _el('user_role_buyer').checked ? 'buyer' : 'seller',
                _el('user_username').value,
                _el('user_password').value
            )
        },
        // -------
        'buy_products': () => {
            vTask['VIEW.set_frame']( 'buy' )
            vTask['BUYER.products_can_buy.refresh']()
        },
        // -------
        'back_to_deposit': () => {
            vTask['VIEW.set_frame']( 'deposit' )
        },
        // -------
        'exit': () => { 
            vTask['USER.signout']()
        },
        // -------
        'product_new': () => {
            vTask['SELLER.sell_product'](
                _el('product_name').value,
                parseInt( _el('product_cost').value ),
                parseInt( _el('product_amount').value )
            )
         },
         // -------
        'my_products': ( evt ) => {
            var a
            if ( a = parseInt( evt.target.getAttribute( 'data-add' ) ) ) {
                c.updateProduct( { 'uid': evt.target.getAttribute( 'data-uid' ), 'amount': a } )
                .then( ( resp ) => {
                    if ( resp['req_id'] ) {
                        setTimeout(()=>{
                            c.getReqStatus( resp['req_id'] )
                            .then( ( resp ) => {
                                if ( resp['success'] ) {
                                    vTask['SELLER.products_in_stock.refresh']()
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
        },
        // -------
        'coins': ( evt ) => {
            var val
            if (val = evt.target.getAttribute('data-val')) {
                evt.target.className = 'active'
                setTimeout( ( evtarget ) => { evtarget.className = '' }, 100, evt.target )
                vTask['BUYER.deposit']( val )
            }
        },
        // -------
        'insert_deposit_amount': () => {
            var val = _el('deposit_amount').value
            if ( val ) {
                vTask['BUYER.deposit']( parseInt( val ) )
            }
        },
        // -------
        'products': ( evt ) => {
            if ( 'buy' == evt.target.getAttribute('data-rel') ) {
                vTask['BUYER.buy_product'](
                    evt.target.getAttribute('data-uid'),
                    evt.target.getAttribute('data-amount')
                )        
            }
        }
    },
// -------
    'VIEW.keydown': {
        // -------
        'user_password': ( evt ) => {
            ;( evt.code == 'Enter' ) && vTask['USER.signin']( 
                _el('user_role_buyer').checked ? 'buyer' : 'seller',
                _el('user_username').value,
                _el('user_password').value
            )
        },
        // -------
        'product_amount': ( evt ) => {
            ;( evt.code == 'Enter' ) && vTask['SELLER.sell_product'](
                _el('product_name').value,
                parseInt( _el('product_cost').value ),
                parseInt( _el('product_amount').value )
            )
        }
    }
}

document.addEventListener( 'mousedown', ( evt ) => {
    var evtarget_id = evt.target.getAttribute('data-listen-mousedown-target') || evt.target.id
    ;onEvent['VIEW.mousedown'][ evtarget_id ] && onEvent['VIEW.mousedown'][ evtarget_id ]( evt )
})
document.addEventListener( 'keydown', ( evt ) => {
    ;onEvent['VIEW.keydown'][ evt.target.id ] && onEvent['VIEW.keydown'][ evt.target.id ]( evt )
})
c.onauth('switch_frame', onEvent['CLIENT.auth'])