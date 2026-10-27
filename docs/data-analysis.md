# Data analysis: tickets-prueba.xlsx

## Findings

1. The same product has different prices.
2. A ticket can have different products.
3. The same product has different suppliers.
4. One supplier per ticket, same for land.
5. Land is where the purchase is made, not where the product is.
6. Ticket total does NOT exist. The total we see is the product quantity times the price.
7. There are lines with quantity 0.
8. In some tickets there are duplicated products.
9. One ticket code has 5 digits and the rest have 7.
10. The real total of the purchase is not there yet. We still need to decide if we calculate it or store it.
11. Land and supplier names stay the same in the whole file.


## Decisions
1. Each table has its own ID as primary key, and code as a unique field. The code comes from an outside source typed by hand and it can change, so it is not stable as a primary key. Also, we see inconsistent format in the ticket code, so as a basic standard we will use id as primary key in all of them.

Model:

![Data model diagram](images/data-model.png)
