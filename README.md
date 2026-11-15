<div align="center">

![Header](https://capsule-render.vercel.app/api?type=waving&color=CC0000&height=200&section=header&text=UE%20Campus%20Portal&fontSize=52&fontColor=ffffff&animation=fadeIn)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&pause=1000&color=CC0000&center=true&vCenter=true&width=600&lines=UE+Smart+Campus+Portal;Find+your+classroom+in+seconds;Live+timetable+-+no+more+guessing;Indoor+navigation+via+QR+code;Built+for+UE+Dubai)](https://git.io/typing-svg)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Deployed on Vultr](https://img.shields.io/badge/Deployed%20on-Vultr-007BFC?style=for-the-badge&logo=vultr&logoColor=white)

<br/>

> A smart campus web portal for **University of Europe for Applied Sciences — Dubai**  
> Check classroom availability, find your class by matric number, and navigate the building — all in one place.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗓️ **Live Timetable Engine** | Weekly schedule with a live/simulated clock — rooms show as taken or free in real time |
| 🔍 **Find My Class** | Enter your matriculation number and instantly see your current or next class + room |
| 🧭 **Indoor Navigation** | "You Are Here" map with `?from=` QR code support for room-to-room directions |
| 🏫 **Room Details on Click** | Click any occupied room to see course name, professor, and schedule details |
| 📐 **Smart Capacity Rule** | Rooms with 45+ students automatically suggest merging with Room 2 |
| 🔎 **Course Search** | Search any course to see if it has started and which room it's in |
| 🛠️ **Admin Dashboard** | Staff can manage timetables, rooms, and view occupancy at a glance |
| 💬 **Complaint Box** | Anonymous complaint and feedback submission for students |
| 🤖 **Campus Chatbot** | AI-powered assistant for campus FAQs and room queries |

---

## 🏗️ Project Structure

```
Ue-portal/
├── frontend/
│   ├── index.html          # Main portal entry
│   ├── timetable.html      # Live weekly timetable
│   ├── find-class.html     # Find My Class (matric number search)
│   ├── navigation.html     # Indoor navigation map
│   ├── admin.html          # Admin / staff dashboard
│   ├── complaint.html      # Complaint box
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── timetable.js
│   │   ├── navigation.js
│   │   └── chatbot.js
│   └── assets/
│       └── rooms/          # Classroom photos (add your own)
│
├── backend/
│   ├── server.js           # Express entry point
│   ├── routes/
│   │   ├── timetable.js
│   │   ├── rooms.js
│   │   └── complaints.js
│   └── data/
│       └── timetable.json  # Timetable seed data
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- npm v9+
- Git

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/astrax-gif/Ue-portal.git
cd Ue-portal

# 2. Install backend dependencies
cd backend
npm install

# 3. Start the backend
npm start
# Server runs at http://localhost:3000

# 4. Open the frontend
# Open frontend/index.html in your browser
# or use Live Server in VS Code
```

---

## ☁️ Deploying to Vultr

### 1 — Create your VPS
Go to [Vultr](https://vultr.com) → New Instance → Cloud Compute → Ubuntu 22.04 LTS → $6/mo plan.

### 2 — Server setup

```bash
# SSH in
ssh root@YOUR_VULTR_IP

# Update & install dependencies
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx
npm install -g pm2
```

### 3 — Clone & run

```bash
cd /var/www
git clone https://github.com/astrax-gif/Ue-portal.git
cd Ue-portal/backend
npm install

# Start with PM2 (stays alive after logout)
pm2 start server.js --name ue-portal
pm2 save && pm2 startup
```

### 4 — Configure Nginx

```bash
nano /etc/nginx/sites-available/ue-portal
```

Paste:

```nginx
server {
    listen 80;
    server_name YOUR_VULTR_IP;

    root /var/www/Ue-portal/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/ue-portal /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Open firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Visit `http://YOUR_VULTR_IP` — portal is live 🎉

---

## 🎨 Design

- **Color palette:** UE Dubai red `#CC0000` + white
- **Fonts:** Inter / system-ui
- **Style:** Clean, minimal — optimized for quick room lookups on mobile

---

## 📸 Screenshots

> _Add screenshots here once deployed_

```md
![Timetable View](./assets/screenshots/timetable.png)
![Find My Class](./assets/screenshots/find-class.png)
![Navigation Map](./assets/screenshots/navigation.png)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Data | JSON (timetable seed) |
| Hosting | Vultr Cloud Compute |
| Web Server | Nginx + PM2 |

---

## 👨‍💻 Author

**Made for UE Dubai — Digital Transformation & Decision Support Systems**  
Built as part of FAB Innovation Month 2026 🏆

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=CC0000&height=100&section=footer&animation=fadeIn)

</div>
