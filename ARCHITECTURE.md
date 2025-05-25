```mermaid
---
config:
  layout: elk
---

%% Palette: 
%% Clients (Browser/App)         - #D6EAF8  (Blue)
%% Networking & Delivery         - #F9E79F  (Yellow)
%% Compute Cluster (Backend)     - #D5F5E3  (Green)
%% Data Stores                   - #FADBD8  (Pink)
%% Media Services                - #D2B4DE  (Purple)

%% === 1. Minimal (MVP) Diagram ===

flowchart LR
  subgraph CLIENTS["Clients (Browser/App)"]
    style CLIENTS fill:#D6EAF8,stroke:#3498DB,stroke-width:2px
    UA["User A"]
    UB["User B"]
  end
  subgraph BACKEND["Compute Cluster"]
    style BACKEND fill:#D5F5E3,stroke:#1D8348,stroke-width:2px
    API["API (Auth, REST)"]
    WS["WebSocket (Signaling/Chat)"]
  end

  UA -- "REST" --> API
  UB -- "REST" --> API
  UA -- "WebSocket" --> WS
  UB -- "WebSocket" --> WS
  UA -. "WebRTC Signaling" .- WS
  UB -. "WebRTC Signaling" .- WS
  UA == "WebRTC Media" === UB
```
%% ----------------------------------
```mermaid
---
config:
  layout: elk
---

%% === 2. Add Persistence (Database) and Caching (Redis) ===

flowchart LR
  subgraph CLIENTS["Clients (Browser/App)"]
    style CLIENTS fill:#D6EAF8,stroke:#3498DB,stroke-width:2px
    UA["User A"]
    UB["User B"]
  end
  subgraph BACKEND["Compute Cluster"]
    style BACKEND fill:#D5F5E3,stroke:#1D8348,stroke-width:2px
    API["API (Auth, REST)"]
    WS["WebSocket (Signaling/Chat)"]
  end
  subgraph DATA["Data Stores"]
    style DATA fill:#FADBD8,stroke:#922B21,stroke-width:2px
    DB["MongoDB"]
    Redis["Redis"]
  end

  UA -- "REST" --> API
  UB -- "REST" --> API
  UA -- "WebSocket" --> WS
  UB -- "WebSocket" --> WS
  API -- "Sessions/Users" --> DB
  WS -- "Sessions/Chat" --> DB
  API -- "Matchmaking/Cache" --> Redis
  WS -- "Pub/Sub/Queue" --> Redis
  UA -. "WebRTC Signaling" .- WS
  UB -. "WebRTC Signaling" .- WS
  UA == "WebRTC Media" === B
```
%% ----------------------------------
```mermaid
---
config:
  layout: elk
---

%% === 3. Add Networking, TURN for Media Reliability ===

flowchart LR
  subgraph CLIENTS["Clients (Browser/App)"]
    style CLIENTS fill:#D6EAF8,stroke:#3498DB,stroke-width:2px
    UA["User A"]
    UB["User B"]
  end
  subgraph DELIVERY["Networking & Delivery"]
    style DELIVERY fill:#F9E79F,stroke:#B7950B,stroke-width:2px
    ALB["App Load Balancer"]
    NLB["Network LB (TURN UDP/TCP)"]
  end
  subgraph BACKEND["Compute Cluster"]
    style BACKEND fill:#D5F5E3,stroke:#1D8348,stroke-width:2px
    API["API (Auth, REST)"]
    WS["WebSocket (Signaling/Chat)"]
  end
  subgraph DATA["Data Stores"]
    style DATA fill:#FADBD8,stroke:#922B21,stroke-width:2px
    DB["MongoDB"]
    Redis["Redis"]
  end
  subgraph MEDIA["Media Services"]
    style MEDIA fill:#D2B4DE,stroke:#6C3483,stroke-width:2px
    TURN["TURN Server (Coturn)"]
  end

  UA -- "REST" --> ALB
  UB -- "REST" --> ALB
  ALB --> API
  ALB --> WS
  UA -- "WebSocket" --> ALB
  UB -- "WebSocket" --> ALB
  API -- "Sessions/Users" --> DB
  WS -- "Sessions/Chat" --> DB
  API -- "Matchmaking/Cache" --> Redis
  WS -- "Pub/Sub/Queue" --> Redis
  UA -. "WebRTC Signaling" .- WS
  UB -. "WebRTC Signaling" .- WS
  UA == "WebRTC Media" === B
  UA -- "Media Fallback (UDP/TCP)" --> NLB
  UB -- "Media Fallback (UDP/TCP)" --> NLB
  NLB --> TURN
  TURN -- "Relay Media" --> UA
  TURN -- "Relay Media" --> UB
```
%% ----------------------------------
```mermaid
---
config:
  layout: elk
---

%% === 4. Full Production Cloud (with CDN, AWS Kinesis, etc) ===

flowchart LR
  subgraph CLIENTS["Clients (Browser/App)"]
    style CLIENTS fill:#D6EAF8,stroke:#3498DB,stroke-width:2px
    A["User A React Web App"]
    B["User B React Web App"]
  end
  subgraph AWS_CLOUD["AWS Cloud"]
    direction TB;
    subgraph DELIVERY["Networking & Delivery"]
      style DELIVERY fill:#F9E79F,stroke:#B7950B,stroke-width:2px
      CF["CloudFront CDN (Static SPA)"]
      ALB["(Application Load Balancer)"]
      NLB["(Network LB for TURN UDP)"]
    end
    subgraph BACKEND["Compute Cluster"]
      direction TB;
      style BACKEND fill:#D5F5E3,stroke:#1D8348,stroke-width:2px
      API["Node.js API Service (Express, JWT Auth)"]
      WS["Node.js WebSocket Service<br/>(Signaling & Chat)"]
    end
    subgraph DATA["Data Stores"]
      style DATA fill:#FADBD8,stroke:#922B21,stroke-width:2px
      DB["(MongoDB Atlas or RDS PostgreSQL)"]
      Redis["(Redis ElastiCache Pub/Sub & Cache)"]
    end
    subgraph MEDIA["Media Services"]
      style MEDIA fill:#D2B4DE,stroke:#6C3483,stroke-width:2px
      Kinesis["[AWS Kinesis WebRTC Channels]"]
      TURN["[Coturn TURN Servers (EC2 Autoscale)]"]
    end
  end

  A -- "HTML/JS/CSS" --> CF
  CF -- "HTTPS GET" --> ALB
  A -- "REST API calls (JWT)" --> ALB --> API
  B -- "REST API calls" --> ALB --> API
  API -- "Auth & Queries" --> DB
  API -- "Session records" --> DB
  API -- "caching" --> Redis
  A -- "WebSocket (WSS)" --> ALB --> WS
  B -- "WebSocket (WSS)" --> ALB --> WS
  WS -- "Pub/Sub" --> Redis
  WS -- "Session state" --> Redis
  WS -- "Session logs" --> DB
  WS -- "ICE config (STUN/TURN info)" --> A
  WS -- "ICE config (STUN/TURN info)" --> B
  A -- "WebRTC Offer/Answer (signaling)" --> WS
  WS -- "Signal via Redis/Direct" --> WS
  WS -- "WebRTC-Answer" --> B
  A == "WebRTC-P2P" === B
  A -. "if P2P fails" .- B
  A -- "Media via TURN (UDP/TCP)" --> NLB --> TURN
  B -- "Media via TURN" --> NLB --> TURN
  A & B -. "Alternative" .- Kinesis
  A -- "Kinesis Signaling/DataChannels" --> Kinesis
  B -- "Kinesis Signaling/DataChannels" --> Kinesis
  Kinesis -- "TURN relay (managed)" --> A
  Kinesis -- "TURN relay (managed)" --> B
```
```mermaid
---
config:
  layout: elk
---

%% 1. FLOWCHART / BLOCK DIAGRAM ("Big Map")

flowchart LR
  subgraph CLIENTS["Clients (Browser/App)"]
    style CLIENTS fill:#D6EAF8,stroke:#3498DB,stroke-width:2px
    UA["User A"]
    UB["User B"]
  end
  subgraph BACKEND["Compute Cluster"]
    style BACKEND fill:#D5F5E3,stroke:#1D8348,stroke-width:2px
    API["Node.js API"]
    WS["WebSocket (Signaling/Chat)"]
  end
  subgraph DATA["Data Stores"]
    style DATA fill:#FADBD8,stroke:#922B21,stroke-width:2px
    DB["MongoDB"]
    Redis["Redis"]
  end
  subgraph MEDIA["Media Services"]
    style MEDIA fill:#D2B4DE,stroke:#6C3483,stroke-width:2px
    TURN["TURN Server"]
  end

  UA -- "REST" --> API
  UB -- "REST" --> API
  UA -- "WebSocket" --> WS
  UB -- "WebSocket" --> WS
  API -- "Sessions/Users" --> DB
  WS -- "Sessions/Chat" --> DB
  API -- "Matchmaking/Cache" --> Redis
  WS -- "Pub/Sub/Queue" --> Redis
  UA -. "WebRTC Signaling" .- WS
  UB -. "WebRTC Signaling" .- WS
  UA == "WebRTC Media" === UB
  UA -- "TURN Media (if needed)" --> TURN
  UB -- "TURN Media (if needed)" --> TURN
```
%% ----------------------------------
```mermaid
---
config:
  layout: elk
---

%% 2. SEQUENCE DIAGRAM (A 1:1 Video Call)

sequenceDiagram
    participant UA as User A (Browser)
    participant WS as WebSocket
    participant UB as User B (Browser)
    participant TURN as TURN Server

    UA->>WS: Login/Join Lobby
    UB->>WS: Login/Join Lobby
    WS-->>UA: "Paired with B"
    WS-->>UB: "Paired with A"
    UA->>WS: SDP Offer, ICE Candidates
    WS->>UB: Forward SDP, ICE
    UB->>WS: SDP Answer, ICE Candidates
    WS->>UA: Forward SDP, ICE
    UA-->>UB: WebRTC Media (direct P2P)
    Note right of UA: If P2P fails
    UA-->>TURN: Media via TURN
    UB-->>TURN: Media via TURN
```
%% ----------------------------------


%% 3. COMPONENT TABLE (COLOR-KEYED LEGEND)

%% This is not a diagram but shown here in color for reference.

| Component      | Purpose                                 | Tech/Notes      |
|----------------|-----------------------------------------|-----------------|
| <span style="background-color:#D6EAF8">Frontend (SPA)</span> | UI, camera, signaling, WebRTC           | React           |
| <span style="background-color:#D5F5E3">API</span>            | Auth, user/session mgmt, REST endpoints | Node/Express    |
| <span style="background-color:#D5F5E3">WebSocket</span>      | Realtime signaling, chat, pairing       | Node, Socket.IO |
| <span style="background-color:#FADBD8">MongoDB</span>        | Persistent storage for users/sessions   | MongoDB Atlas   |
| <span style="background-color:#FADBD8">Redis</span>          | Queue, matchmaking, pub/sub             | ElastiCache     |
| <span style="background-color:#D2B4DE">TURN Server</span>    | NAT traversal, fallback media relay     | Coturn (EC2)    |

%% ----------------------------------

%% 4. GLOSSARY / LEGEND (Cloud, WebRTC, Networking Terms)

%% This is not a diagram but shown here, color-keyed to match above.

| <span style="background-color:#D6EAF8">WebRTC</span>   | Browser tech for P2P video, audio, data (encrypted, low latency)      |
|---------------------|-----------------------------------------------------------------------|
| <span style="background-color:#D2B4DE">TURN</span>     | Server to relay media when P2P fails (e.g. corporate firewalls)       |
| <span style="background-color:#D2B4DE">STUN</span>     | Helps clients discover their public IP for NAT traversal              |
| <span style="background-color:#D2B4DE">ICE</span>      | Interactive Connectivity Establishment; tries all possible network paths |
| SDP      | Session Description Protocol; describes connection media, codecs      |
| <span style="background-color:#D5F5E3">Socket.IO</span>| Library for real-time WebSockets (with fallback)                      |
| JWT      | JSON Web Token; stateless authentication                             |
