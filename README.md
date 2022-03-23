###Vending machine exercise.
####(simple serverless architecture)

#####Data
**users**
> uid
> username
> password
> deposit
> role:[seller|buyer]

**sessions**
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
>    /buy|sell/╌╌╌╌╌▷ post.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯         / buy_recheck _( [change|product] unavailable, providing choices )_ /
>        ╎                                                │         / buy_success _( { spent:<int>, products:[], change:[] } )_ /
>        ╎                                                │         / sell_status _( { status:[0:ok|1:error], message:'' )_ /
>        ╎                                                │                      ╎
>        ╎                        ╭────/ validate role /──╯                      ╎
>        ╎                        │    / if buyer: updateDeposits() /            ╎
>        ╎                        │                                              ╎
>        ╎       ╱  sessions  ╲   ▽                    ─────────────────         ╎
>        ╎   ┌───     users    ───┐  ◀─────────────▶ ╳ gatekeeper.worker ╳       ╎
>        ╎   ║                    ║             ╭╌╌▷   ────────┬────────         ╎
>        ╎                                      ╎              ╎                 ╎
>    /deposit/╌╌╌╌╌╌▷ post.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯              ╎                 ╎
>        ╎                                      ╎              ╎                 ╎
>        ╎      ╭╌╌╌▷ post.fifo ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯              ╎                 ╎
>        ╎      ╎                                              ╎                 ╎
>        ╎      ╎                                        / give auth /           ╎
>        ╎      ╎                                              ╎                 ╎
>        ╎      ╎                       ───────────            ╎                 ╎
>        ╰╌╌╌╱ req  ╲ ◁╌╌╌╌╌╌╌╌╌╌╌╌▷  ╳ user.worker ╳ ◁╌╌╌╌╌╌╌╌╯╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
>            ╲ auth ╱                   ───────────


#####Requests
**user**.worker _reqAuth_ payload:
> token [<auth_token>|new_(seller|buyer)] _( login | register)_
> username
> password

**user**.worker _deposit_ payload:
> amount:[5,10,20,50,100]

**user**.worker _buy_ payload:
> product_id
> amount

**user**.worker _sell_ payload:
> product_id?
> product_name? _( if product\_name: newProduct() )_
> cost _( if product\_id: updateProductCost() )_
> amount