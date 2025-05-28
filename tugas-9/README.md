# **Web Programming 9th Assignment**

Faiz Muhammad Kautsar  
5054231013

View the deployed version at: [https://pweb-tugas9.spuun.art/](https://pweb-tugas9.spuun.art/)

![alt text](image.png)
![alt text](image-1.png)

I recycled the structure from the previous [`tugas-8`](../tugas-8/) assignment, migrated to a PostgreSQL database via [Supabase](supabase.com/), connected via the [Prisma ORM](https://www.prisma.io/). (https://tugas-9.vercel.app/).

Since this is practically the same as the previous assignment, all I did was I swapped it out for the backend to use an ORM, here I used Prisma ORM to do the schema, I had to modify some of the setup since the ORM requires us to rebuild the interface module component to prevent outdated cached modules (which would be at `/generated`, I set this to the `.gitignore` to omit it from commits intentionally).

Like the previous assignment, the UI designs _are_ responsive, with media queries coded in.

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
        C --> E[Express Server<br>+ Prisma Client]
        D --> E
        E <--> |Prisma ORM| F[(PostgreSQL)]
    end

    subgraph Database Schema
        F --> G[Student Table<br>- id: String @uuid<br>- name: String<br>- studentId: String<br>- course: String<br>- lecturer: String<br>- createdAt: DateTime<br>- updatedAt: DateTime]
    end

style A fill:#fce4ec,stroke:#e91e63
style B fill:#fce4ec,stroke:#e91e63
style E fill:#f3e5f5,stroke:#9c27b0
style F fill:#e3f2fd,stroke:#2196f3
style G fill:#e3f2fd,stroke:#2196f3

```
