from pycurl import Curl
from io import BytesIO
import json, random

def endpoints(route):
    return 'http://127.0.0.1:8000/' + route

def post( _url, _data ):
    resp_buffer = BytesIO()
    c = Curl()
    c.setopt( c.URL, _url )
    # c.setopt( c.HEADER, 1 )
    c.setopt( c.WRITEDATA, resp_buffer )
    c.setopt( c.UPLOAD, 1 )


    req_buffer = BytesIO( json.dumps( _data ).encode( 'utf-8' ) )
    c.setopt( c.READDATA, req_buffer )
    c.perform()
    c.close()

    resp = resp_buffer.getvalue().decode( 'utf-8' )
    try:
        resp_obj = json.loads( resp )
    except:
        print( 'ERROR: sent {0} to {1} - received malformed JSON:'.format( _data, _url ) )
        print( resp )
        exit()

    return resp_obj

def SUCCESS():
    print('┄┈┈┄┈┈┄┈┈┄┈┈┄┈┈┄┈')
    print('┄┈┈╡ SUCCESS ╞┄┈┈')
    print('┄┈┈┄┈┈┄┈┈┄┈┈┄┈┈┄┈')

def FAILED():
    print('┄ ┈ ┈ ┄ ┈ ┈ ┄ ┈ ┈')
    print(' ┈ test failed ┈ ')
    print('┄ ┈ ┈ ┄ ┈ ┈ ┄ ┈ ┈')
    exit()

class User:
    def signup( type, username, password ):
        payload = { 'token': 'new_' + type, 'username': username, 'password': password }
        resp = post( 
            endpoints('user'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        if 'wsess_id' not in resp: FAILED()
        return resp

    def login( type, username, password ):
        payload = { 'token': type, 'username': username, 'password': password }
        resp = post( 
            endpoints('user'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        if 'wsess_id' not in resp: FAILED()
        return resp

    def getToken( wsess_id ):
        payload = { 'token': 'get', 'wsess_id': wsess_id }
        resp = post( 
            endpoints('user'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        if 'error' in resp: FAILED()
        return resp

    def deposit( wsess_id, token, amount ):
        payload = { 'token': token, 'wsess_id': wsess_id, 'amount': amount }
        resp = post( 
            endpoints('deposit'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        return resp

    def sell( wsess_id, token, product ):
        payload = { 'token': token, 'wsess_id': wsess_id, 'product_name': product['product_name'], 'cost': product['cost'], 'amount': product['amount'] }
        resp = post( 
            endpoints('sell'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        return resp

    def buy( wsess_id, token, buy_req ):
        payload = { 'token': token, 'wsess_id': wsess_id, 'product_uid': buy_req['product_uid'], 'amount': buy_req['amount'] }
        resp = post( 
            endpoints('buy'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        return resp

    def getReqStatus( wsess_id, token, req_id ):
        payload = { 'token': token, 'wsess_id': wsess_id, 'req_id': req_id }
        resp = post( 
            endpoints('req_status'),
            payload
        )
        print('=>', payload)
        print('<=', resp )
        if 'error' in resp: FAILED()
        return resp

    def randomUsername():
        return 'aurel' + str( random.randrange(1000000,9999999) )