#!/usr/bin/env python3

import time
import main as M

busername = M.User.randomUsername()
bpass = '123'

print('\n# -- -- request SELLER SIGNUP --')
resp = M.User.signup( 'seller', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' not in resp: M.FAILED()
token = resp['token']
print('# -- ok')


print('\n# -- -- request SELLER SELL --')
resp = M.User.sell( wsess_id, token, { "product_name": "apple", "cost": 15, "amount": 16 } )    
req_id = resp['req_id']

print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( wsess_id, token, req_id )


print('\n# -- -- request BUYER SIGNUP --')
resp = M.User.signup( 'buyer', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' not in resp: M.FAILED()
token = resp['token']
print('# -- ok')


print('\n# -- -- request BUYER SELL --')
resp = M.User.sell( wsess_id, token, { "product_name": "pineapple", "cost": 20, "amount": 32 } )    
req_id = resp['req_id']

print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( wsess_id, token, req_id )


# > product_uid?
# > product_name? _( if product\_name: newProduct() )_
# > cost _( if product\_uid: updateProductCost() )_
# > amount