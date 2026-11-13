import small from './sample.mmd?raw'

const large = `%%{arch: {view: "iso", nav: "drill"}}%%
flowchart TD
  Client((Browser)) -->|HTTPS| WAF
  Mobile((Mobile App)) -->|HTTPS| WAF
  subgraph Platform["Platform"]
    subgraph Edge["Edge"]
      WAF{WAF Rules} -->|allowed| LB[Load Balancer]
      LB --> GW[API Gateway]
      GW -->|token check| AuthN[AuthN]
      CDN[(Static Cache)] --- LB
    end
    subgraph Core["Core Services"]
      subgraph Orders["Orders"]
        OrderAPI[Order API] -->|validate| OrderVal{Valid?}
        OrderVal -->|yes| OrderSvc[Order Service]
        OrderVal -->|no| OrderErr[Reject]
        OrderSvc --> OrderQ[(Order Queue)]
      end
      subgraph Payments["Payments"]
        PayAPI[Payment API] --> Fraud{Fraud Check}
        Fraud -->|ok| Charge[Charge Card]
        Fraud -->|flagged| Review[Manual Review]
        Charge --> Ledger[(Ledger)]
        Review -->|approve| Charge
      end
      subgraph Users["Users"]
        UserAPI[User API] --> Profile[Profile Svc]
        Profile --> Prefs[(Preferences)]
        UserAPI --> Session[Session Svc]
      end
      subgraph Catalog["Catalog"]
        CatAPI[Catalog API] --> Inventory[Inventory]
        CatAPI --> Pricing(Pricing)
        Inventory --> StockDB[(Stock DB)]
      end
      subgraph Notify["Notifications"]
        NotifSvc[Notifier] --> Email(Email)
        NotifSvc --> Push(Push)
        NotifSvc --> SMS(SMS)
      end
    end
    subgraph Data["Data Layer"]
      subgraph SQL["Relational"]
        PG[(PostgreSQL)] -->|replicates| Replica[(Read Replica)]
        PG --> Backup[(Backup)]
      end
      subgraph Cache["Caching"]
        Redis[(Redis)]
        Memc[(Memcached)]
      end
      subgraph Search["Search"]
        ES[(Elastic)] --> Indexer[Indexer]
      end
    end
    subgraph Ops["Observability"]
      Metrics[Metrics] --> Dash[Dashboards]
      Logs[Logs] --> Dash
      Traces[Tracing] --> Dash
      Dash --> Alerts{Alert?}
      Alerts -->|page| OnCall((On Call))
    end
  end
  GW -->|/orders| OrderAPI
  GW -->|/pay| PayAPI
  GW -->|/users| UserAPI
  GW -->|/catalog| CatAPI
  AuthN --> Session
  OrderSvc -->|reserve| Inventory
  OrderSvc -->|charge| PayAPI
  OrderQ -->|events| NotifSvc
  Charge -->|receipt| NotifSvc
  Ledger --> PG
  OrderSvc --> PG
  Profile --> PG
  StockDB --> Replica
  Session --> Redis
  Pricing --> Memc
  CatAPI --> ES
  Inventory -->|reindex| Indexer
  Indexer --> ES
  OrderSvc --> Metrics
  Charge --> Metrics
  GW --> Logs
  Fraud --> Traces
  Replica --> Metrics
  Email -->|bounce| Logs
  Alerts -->|retry| OrderSvc
  OrderSvc -->|status| GW
  GW -->|response| Client
`

const srcs = Array.from({ length: 30 }, (_, i) => `S${i + 1}[Source ${i + 1}]`)
const wide = `flowchart TD
${srcs.map((s, i) => `  ${s} --> T${(i % 5) + 1}${i % 7 === 0 ? `\n  S${i + 1} -->|also| T${((i + 2) % 5) + 1}` : ''}`).join('\n')}
  T1[(Target A)]
  T2[Target B]
  T3(Target C)
  T4{Target D}
  T5[(Target E)]
`

const login = `sequenceDiagram
  actor User
  participant Browser
  participant API as API Gateway
  participant Auth as Auth Service
  participant DB as User DB
  participant Mail
  User->>Browser: enter credentials
  Browser->>+API: POST /login
  API->>+Auth: verify(user, pass)
  Auth->>+DB: SELECT user
  DB-->>-Auth: user row
  alt valid password
    Auth-->>API: JWT
    API-->>Browser: 200 + cookie
    Browser-->>User: show dashboard
  else invalid password
    Auth->>DB: increment failures
    Auth-->>API: 401
    loop up to 3 times
      Browser->>User: retry prompt
      User->>Browser: new password
    end
    Note over Auth,Mail: lock account after 5 failures
    Auth-)Mail: send lockout email
  end
  deactivate Auth
  API-->>-Browser: done
  Browser-xAPI: abort stale request
`

const checkout = `sequenceDiagram
  actor Shopper
  participant Web
  participant Cart
  participant Catalog
  participant Pricing
  participant Orders
  participant Payments
  participant Fraud
  participant Warehouse
  participant Notify
  Shopper->>Web: click Checkout
  Web->>+Cart: getCart()
  Cart->>Catalog: lookup items
  Catalog-->>Cart: item details
  Cart->>Pricing: priceCart()
  Pricing-->>Cart: totals + tax
  Cart-->>-Web: cart summary
  Web-->>Shopper: show summary
  Shopper->>Web: confirm address
  Web->>+Orders: createOrder()
  Orders->>Catalog: reserve stock
  alt stock available
    Catalog-->>Orders: reserved
    Orders->>+Payments: charge(total)
    Payments->>+Fraud: score(order)
    Fraud-->>-Payments: low risk
    opt coupon applied
      Payments->>Pricing: redeem coupon
      Pricing-->>Payments: ok
    end
    Payments-->>-Orders: paid
    Orders->>Warehouse: pick & pack
    Warehouse-->>Orders: shipment id
    par notify customer
      Orders-)Notify: order confirmation
      Notify-->>Shopper: email
    and update inventory
      Orders-)Catalog: decrement stock
    end
    Orders-->>-Web: order #1234
    Web-->>Shopper: success page
  else out of stock
    Catalog-->>Orders: unavailable
    Orders-->>Web: 409
    Web-->>Shopper: sorry
  end
  Note right of Warehouse: ships within 24h
  loop every hour
    Warehouse->>Orders: tracking update
    Orders->>Notify: status changed
  end
  Orders->>Orders: archive order
  Fraud-xPayments: late chargeback signal
`

export const SAMPLES: Record<string, string> = {
  'flow: small (sample.mmd)': small,
  'flow: large (~50 nodes)': large,
  'flow: wide (30 → 5)': wide,
  'seq: login flow': login,
  'seq: checkout flow': checkout,
}
