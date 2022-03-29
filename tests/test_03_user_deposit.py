#!/usr/bin/env python3

import time
import main as M

busername = M.User.randomUsername()
bpass = '123'

print('\n# -- -- request BUYER DEPOSIT (amount=5, empty wsess_id and token) --')
resp = M.User.deposit( '', '', 5 )    
if 'error' not in resp: M.FAILED()
if resp['error'] != 'UNAUTHORIZED': M.FAILED()

#FIXME: gateway.js@142 - add regex validators
print('\n# -- -- request BUYER DEPOSIT (amount=5, wrong wsess_id and token) --')
resp = M.User.deposit( '*', '*', 5 )
if 'req_id' not in resp: M.FAILED()
req_id = resp['req_id']

#FIXME: gateway.js@119 - add regex validators
print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( '*', '*', req_id )
if 'error' not in resp: M.FAILED()
if resp['error'] != 'TIMEOUT': M.FAILED()


print('\n# -- -- request BUYER SIGNUP --')
resp = M.User.signup( 'buyer', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' not in resp: M.FAILED()
token = resp['token']
print('# -- ok')


for amount in [5, 10, 20, 50, 100]:
    print('\n# -- -- request BUYER DEPOSIT (amount={a}) --'.format(a=amount))
    resp = M.User.deposit( wsess_id, token, amount )
    if 'req_id' not in resp: M.FAILED()
    req_id = resp['req_id']

    print('# -- get request status --')
    time.sleep(0.01) 
    resp = M.User.getReqStatus( wsess_id, token, req_id )
    if 'success' not in resp: M.FAILED()


print('\n# -- -- request BUYER DEPOSIT (amount=13) --')
resp = M.User.deposit( wsess_id, token, 13 )
if 'req_id' not in resp: M.FAILED()
req_id = resp['req_id']

print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( wsess_id, token, req_id )
if 'success' in resp: M.FAILED()
if resp['failed'] != 'WRONG_AMOUNT': M.FAILED()


print('\n# -- -- request SELLER SIGNUP --')
resp = M.User.signup( 'seller', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' not in resp: M.FAILED()
token = resp['token']
print('# -- ok')


print('\n# -- -- request SELLER DEPOSIT (amount=5) --')
resp = M.User.deposit( wsess_id, token, 5 )    
req_id = resp['req_id']

print('# -- get request status --')
time.sleep(0.01) 
resp = M.User.getReqStatus( wsess_id, token, req_id )
if 'success' in resp: M.FAILED()
if resp['failed'] != 'DEPOSIT_BUYERS_ONLY': M.FAILED()

M.SUCCESS()