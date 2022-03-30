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

