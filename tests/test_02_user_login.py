#!/usr/bin/env python3

import time
import main as M

busername = M.User.randomUsername()
bpass = '123'

print('\n# -- -- request BUYER SIGNUP --')
resp = M.User.signup( 'buyer', busername, bpass )


time.sleep(0.01)
print('\n# -- -- request BUYER LOGIN')
resp = M.User.login( 'buyer', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' not in resp: M.FAILED()
token = resp['token']
print('# -- ok')


print('\n# -- -- request BUYER LOGIN wrong password')
resp = M.User.login( 'buyer', busername, '*' )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' in resp: M.FAILED()
if resp['failed'] != 'INVALID_PASSWORD': M.FAILED()
print('# -- ok')


print('\n# -- -- request SELLER LOGIN with same username')
resp = M.User.login( 'seller', busername, bpass )
wsess_id = resp['wsess_id']

print('# -- get token --')
time.sleep(0.01)
resp = M.User.getToken( wsess_id )
if 'token' in resp: M.FAILED()
if resp['failed'] != 'INVALID_ROLE_USERNAME': M.FAILED()
print('# -- ok')

M.SUCCESS()