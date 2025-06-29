# **Web Programming 11th Assignment**

Faiz Muhammad Kautsar  
5054231013

View the deployed version at: [https://tugas11.spuun.art/](https://tugas11.spuun.art/)

![image 1](./image-1.png)
![image 2](image-2.png)
![image 5](./image-5.png)

I recycled the structure from the previous [`tugas-10`](../tugas-10/) assignment, set up a PostgreSQL database via [Supabase](supabase.com/), connected via the [Prisma ORM](https://www.prisma.io/). (https://tugas-11-pi.vercel.app/).

Like the previous assignment, the UI designs _are_ responsive, with media queries coded in.

![alt text](image-3.png)
![alt text](image-4.png)
![image 6](./image-6.png)

Since this is pretty much a recycle of the previous assignment, I really only added a "generate report" feature. I implemented this with pdfkit.

![image 5](./image-5.png)

You can filter by either or both course and lecturer, and get a PDF of all students attending said class. Here are some samples:

![alt text](image-7.jpg)
![alt text](image-8.jpg)
![alt text](image-9.jpg)

Currently, the flow looks something like this:

```mermaid
graph TD
    subgraph Frontend
        A[Registration Page<br>/index.html] --> |Form Submit<br>with Image Upload| C[POST /api/register]
        A --> |View Button| B[Listing Page<br>/view.html]
        A --> |Reports Button| K[Reports Page<br>/reports.html]
        B --> |Fetch Data| D[GET /api/students]
        B --> |Fetch Images| I[GET /api/student-image/:id]
        K --> |Load Filters| J[GET /api/filters]
        K --> |Generate Report| L[GET /api/generate-report]
    end

    subgraph Backend
        C --> E[Express Server<br>+ Prisma Client<br>+ Multer<br>+ PDFKit]
        D --> E
        I --> E
        J --> E
        L --> E
        E <--> |Prisma ORM| F[(PostgreSQL)]
    end

    subgraph Database Schema
        F --> G[Student Table<br>- id: Int<br>- name: String<br>- studentId: String<br>- course: String<br>- lecturer: String<br>- imageData: Bytes<br>- imageType: String<br>- createdAt: DateTime<br>- updatedAt: DateTime]
    end

    style A fill:#fce4ec,stroke:#e91e63
    style B fill:#fce4ec,stroke:#e91e63
    style K fill:#fce4ec,stroke:#e91e63
    style E fill:#f3e5f5,stroke:#9c27b0
    style F fill:#e3f2fd,stroke:#2196f3
    style G fill:#e3f2fd,stroke:#2196f3
    style I fill:#fce4ec,stroke:#e91e63
    style J fill:#fce4ec,stroke:#e91e63
    style L fill:#fce4ec,stroke:#e91e63

```
