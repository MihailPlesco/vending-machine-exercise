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
product_uid = resp['success']


print('\n# -- -- request BUYER SIGNUP --')
resp = M.User.signup( 'buyer', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' not in resp: M.FAILED()
token = resp['token']
print('# -- ok')


print('\n# -- -- request BUYER DEPOSIT (amount=100) --')
resp = M.User.deposit( wsess_id, token, 100 )
if 'req_id' not in resp: M.FAILED()
req_id = resp['req_id']

print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( wsess_id, token, req_id )
if 'success' not in resp: M.FAILED()


print('\n# -- -- request BUYER BUY --')
resp = M.User.buy( wsess_id, token, { "product_uid": product_uid, "amount": 5 } )
req_id = resp['req_id']

print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( wsess_id, token, req_id )


# > product_uid?
# > product_name? _( if product\_name: newProduct() )_
# > cost _( if product\_uid: updateProductCost() )_
# > amount