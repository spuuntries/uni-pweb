# **Web Programming 8th Assignment**

Faiz Muhammad Kautsar  
5054231013

View the deployed version at: [https://pweb-tugas8.spuun.art/](https://pweb-tugas8.spuun.art/)

![alt text](image.png)
![alt text](image-1.png)

I recycled the FE from the previous [`tugas-6`](../tugas-6/) assignment, added a backend implemented in Express deployed on [Vercel](https://vercel.com/) (https://tugas8-pweb.vercel.app/), with a database deployed at a [Mongodb Atlas](https://www.mongodb.com/atlas) cluster, interfaced via Mongoose.

The UI designs _are_ responsive, with media queries coded in.

![alt text](image-3.png)
![alt text](image-2.png)

Currently, the flow looks something like this:

```mermaid
graph TD
    subgraph Frontend
        A[Registration Page<br>/index.html] --> |Form Submit| C[POST /api/register]
        A --> |View Button| B[Listing Page<br>/view.html]
        B --> |Fetch Data| D[GET /api/students]
    end

    subgraph Backend
        C --> E[Express Server]
        D --> E
        E <--> |Mongoose| F[(MongoDB)]
    end

    subgraph Database Schema
        F --> G[Student Collection<br>- name: String<br>- studentId: String<br>- course: String<br>- lecturer: String]
    end

style A fill:#fce4ec,stroke:#e91e63
style B fill:#fce4ec,stroke:#e91e63
style E fill:#f3e5f5,stroke:#9c27b0
style F fill:#e8eaf6,stroke:#3f51b5
style G fill:#e8eaf6,stroke:#3f51b5
```
