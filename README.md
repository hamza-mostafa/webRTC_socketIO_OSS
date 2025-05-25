# Speed Connect – Cloud-Native 1:1 Video & Chat Starter

A production-ready, cloud-native template for real-time 1:1 video and chat.  
Built with MERN stack (MongoDB, Express, React, Node), Socket.IO, and self-hosted TURN/STUN for reliable peer-to-peer video, scalable to any infra.

---

## Features

- Instant, tag-based user matching (with Redis)
- Encrypted, stateless 1:1 video chat (WebRTC + TURN/STUN)
- Auto-disconnect after 5 minutes
- Real-time chat (Socket.IO)
- JWT authentication
- Fully containerized (Docker Compose)
- Terraform IaC and turnserver ready for production
- Scalable and analytics-ready (MongoDB, Redis)

---

## Architecture

### System Flow Diagram

```mermaid
---
config:
  layout: elk
  look: neo
  theme: mc
---
flowchart LR
    UA["User A (Browser)"] -- WebRTC Signaling --> BE["WebSocket/Signaling (Socket.IO)"]
    UB["User B (Browser)"] -- WebRTC Signaling --> BE
    UA -- Media (SRTP/DTLS) --- UB
    UA -- REST/Auth --> API["Express API"]
    UB -- REST/Auth --> API
    API -- JWT --> UA & UB
    BE -- Redis --> R["Redis"]
    BE -- Session Logs --> M["MongoDB"]
    BE -- ICE/TURN/STUN Info --> TURN["TURN Server"]

```

---

### Sequence Diagram

```mermaid
---
config:
  look: neo
  theme: redux-color
---
sequenceDiagram
    participant UserA as User A (Browser)
    participant UserB as User B (Browser)
    participant API as Express API (Auth/JWT)
    participant WS as WebSocket/Signaling (Socket.IO)
    participant Redis as Redis (Queue/Session)
    participant Mongo as MongoDB (Session/Chat)
    participant TURN as TURN Server
    UserA->>API: 1. POST /login (get JWT)
    UserB->>API: 2. POST /login (get JWT)
    UserA->>WS: 3. Connect Socket.IO (with JWT)
    UserB->>WS: 4. Connect Socket.IO (with JWT)
    WS->>Redis: 5. Enqueue users, match on tags
    WS-->>UserA: 6. "paired" (send TURN/STUN info, peer info)
    WS-->>UserB: 6. "paired" (send TURN/STUN info, peer info)
    UserA->>WS: 7. Send SDP/ICE candidates
    WS->>UserB: 8. Relay SDP/ICE candidates
    UserB->>WS: 9. Send SDP/ICE candidates
    WS->>UserA: 10. Relay SDP/ICE candidates
    UserA->>TURN: 11. Use TURN for media relay (if needed)
    UserB->>TURN: 11. Use TURN for media relay (if needed)
    UserA-->>UserB: 12. Media (SRTP/DTLS) direct or via TURN
    UserA->>WS: 13. Send chat message
    WS->>UserB: 14. Relay chat message
    WS->>Mongo: 15. Persist chat/session log
    WS->>UserA: 16. "session-ended"
    WS->>UserB: 16. "session-ended"
    WS->>Mongo: 17. Log session end
```

---

## Getting Started (Local)

### Prerequisites

- Node.js and npm
- Docker and Docker Compose
- MongoDB, Redis (Docker Compose provided)
- [Optional] Terraform for infra provisioning

### Local Setup

1. **Clone the repo**

   ```bash
   git clone &lt;repo-url&gt; speed-connect
   cd speed-connect
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env for MongoDB, Redis, TURN/STUN config
   ```

3. **Run with Docker Compose**

   ```bash
   docker-compose -f infra/docker-compose.yml up --build
   ```
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend (API): [http://localhost:4000](http://localhost:4000)

---

## Usage

- Open two browser tabs or devices, login as different users.
- Each user joins the lobby, is matched based on tags/interests.
- When paired, WebRTC 1:1 video and chat are enabled.
- Sessions auto-end after 5 minutes.

---

## Cloud Deployment

### Infrastructure

- **Terraform**: `infra/terraform/` for provisioning (edit variables for your VPC, subnets, etc).
- **TURN/STUN**: Customize `infra/turnserver.conf` for your deployment.
- **Docker**: Build images for backend/frontend for ECS, Kubernetes, or other container orchestration.

### Cloud Steps (Sample)

```bash
# Provision infra (update variables.tf)
cd infra/terraform
terraform init
terraform apply

# Build and push Docker images, update your orchestrator (ECS, K8s, etc)
```

---

## Technologies Used

- **Frontend**: React, Vite, WebRTC
- **Backend**: Node.js, Express, Socket.IO
- **Auth**: JWT (stateless)
- **Database**: MongoDB
- **Caching/Matchmaking**: Redis
- **Signaling/Chat**: Socket.IO
- **Media Relay**: Self-hosted TURN/STUN (or cloud)
- **Infra as Code**: Terraform
- **Containerization**: Docker, Docker Compose

---

## Extending

- Add analytics/stream processing via Mongo or Redis pubsub.
- Plug in external TURN (Twilio, Xirsys, or AWS if needed).
- Bring your own CI/CD pipeline—Docker-native.

---

## References

- [WebRTC for the Web](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Docs](https://socket.io/docs/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Terraform](https://www.terraform.io/)

---

*Start local, scale globally. Built for zero-ops 1:1 video networking.*