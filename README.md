# Vending machine exercise.

## (simple serverless architecture)

### Running the app:

> docker-compose up --remove-orphans

#### or if you have node and redis-server running on your local pc:
- edit .env
> ./gateway.js


### Data

**users**
> uid ( = <role>_<username> )
> username
> password
> deposit
> role:\[seller|buyer\]

**auths**
> token
> user_uid
> timestamp

**products** (_stock_)
> uid
> seller_uid
> product_name
> cost
> amount

  
  
>
>                ╱  products  ╲                        ────────────────────
>            ┌───     stock    ───┐  ◀─────────────▶ ╳ stock-handler.worker ╳ ◁╌╌╮ 
>            ║                    ║                    ────────────────────      ╎ 
>                                                         △                      ╎ 

>  / buy|sell /╌╌╌╌╌▷ post.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯                      ╎ 

>        ╎                                                │                / buy_status  /
>        ╎                                                │                / sell_status /
>        ╎                                                │                      ╎
>        ╎                        ╭────/ validate role /──╯                      ╎
>        ╎                        │    / if buyer: updateDeposits() /            ╎
>        ╎                        │                                              ╎
>        ╎       ╱   auths   ╲    ▽                    ─────────────────         ╎
>        ╎   ┌───    users    ───┐  ◀──────────────▶ ╳ gatekeeper.worker ╳       ╎
>        ╎   ║                   ║              ╭╌╌▷   ────────┬────────         ╎
>        ╎                                      ╎              ╎                 ╎
  
>  / deposit /╌╌╌╌╌╌▷ deposit.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╯              ╎                 ╎

>        ╎                                      ╎              ╎                 ╎
>        ╎      ╭╌╌╌▷ auth.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯              ╎                 ╎
>        ╎      ╎                                       / auth status /          ╎
>        ╎      ╎                                       / deposit status /       ╎
>        ╎      ╎                                              ╎                 ╎
>        ╎      ╎                  ───────────                 ╎                 ╎
>        ╰╌╌╌╱ req  ╲ ◁╌╌╌╌╌╌╌╌╌ ╳ user.worker ╳ (wsess)◁╌╌╌╌╌╌╯╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
>            ╲ auth ╱              ───────────


##### Requests
**user**.worker _reqAuth_ payload:
> token [(new_)(seller|buyer)] _( register|login with user/pass )_
> username
> password

**user**.worker _deposit_ payload:
> wsess_uid
> token
> amount:(5|10|20|50|100)

**user**.worker _buy_ payload:
> wsess_uid
> token
> product_uid
> amount

**user**.worker _sell_ payload:
> wsess_uid
> token
> product_uid? _( if product\_uid: update name_if and cost_if )_
> product_name?
> cost?
> amount
