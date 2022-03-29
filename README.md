###Vending machine exercise.
####(simple serverless architecture)

#####Data
**users**
> uid ( = <role>_<username> )
> username
> password
> deposit
> role:[seller|buyer]

**auths**
> token
> user_uid
> timestamp

**products** (_stock_)
> uid
> seller_uid
> product_name
> cost
> amount_available

**in-out**.fifo ( reserving purchase )
> product_uid
> amount
> buyer_uid



>                ╱in-out.fifo╲                         ────────────────────
>            ┌───    stock    ───┐  ◀──────────────▶ ╳ stock-handler.worker ╳ ◁╌╌╮
>            ║                   ║                     ────────────────────      ╎
>                                                         △                      ╎
>    /buy|sell/╌╌╌╌╌▷ post.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯                      ╎
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
>    /deposit/╌╌╌╌╌╌▷ deposit.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╯              ╎                 ╎
>        ╎                                      ╎              ╎                 ╎
>        ╎      ╭╌╌╌▷ auth.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯              ╎                 ╎
>        ╎      ╎                                              ╎                 ╎
>        ╎      ╎                                         / set token /          ╎
>        ╎      ╎                                              ╎                 ╎
>        ╎      ╎                       ───────────            ╎                 ╎
>        ╰╌╌╌╱ req  ╲ ◁╌╌╌╌╌╌╌╌╌╌╌╌▷  ╳ user.worker ╳ ◁╌╌╌╌╌╌╌╌╯╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
>            ╲ auth ╱                   ───────────


#####Requests
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
> product_uid?
> product_name? _( if product\_name: newProduct() )_
> cost _( if product\_uid: updateProductCost() )_
> amount