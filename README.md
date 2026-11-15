(https://github.com/user-attachments/files/34872975/README.md)<div align="center">

![UE Portal](https://capsule-render.vercel.app/api?type=waving&color=0:0a0e27,50:1a237e,100:283593&height=220&section=header&text=UE%20Portal&fontSize=64&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Smart%20Workspace%20%26%20Tenant%20Portal%20%E2%80%94%20Dubai%20World%20Trade%20Centre&descSize=18&descAlignY=60)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1200&color=4FC3F7&center=true&vCenter=true&width=760&lines=Multi-tenant+client+portal+%26+reception+kiosk;Interactive+SVG+floor+plans+with+live+desk+booking;AI+concierge+chat+for+Wi-Fi%2C+rooms+%26+facilities;One-click+brand+switching+per+business)](https://github.com/astrax-gif/Ue-portal)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

![Vultr](https://img.shields.io/badge/Deployed_on-Vultr-007BFC?style=flat-square&logo=vultr&logoColor=white)
![Nginx](https://img.shields.io/badge/Served_by-Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## ✨ What it does

UE Portal is a **multi-tenant client portal and smart reception kiosk** built for coworking spaces and professional offices at **Dubai World Trade Centre (DWTC)**.

Drop in a URL. Get a branded workspace experience — instantly.

---

## 🧩 Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive floor plans** | SVG-based maps with selectable desks, suites and meeting rooms |
| 📅 **Instant booking** | Desk and room booking with confirmation codes |
| 🎨 **Brand switching** | One-click theme swap — a different look per tenant |
| 🤖 **AI concierge** | Chat agent for Wi-Fi, room availability, hours, and facility issues |
| 👤 **Multi-tenant** | Fully isolated workspaces per business |
| 📲 **Reception kiosk mode** | Full-screen check-in flow for lobbies |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UE Portal Stack                          │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐    │
│  │  React   │───▶│  Vite    │───▶│    Nginx (Vultr)   │    │
│  │   + TS   │    │  Build   │    │  /var/www/ue-portal │    │
│  └──────────┘    └──────────┘    └────────────────────┘    │
│                                            ▲                │
│  ┌──────────┐    ┌──────────┐             │                │
│  │ Supabase │    │ Tailwind │   GitHub Actions CI/CD       │
│  │    DB    │    │   CSS    │   push → build → deploy      │
│  └──────────┘    └──────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment (Vultr)

> **Live on Vultr Cloud Compute.** Auto-deploys on every push to `main`.

### Quick start (local dev)

```bash
# 1. Clone
git clone https://github.com/astrax-gif/Ue-portal.git
cd Ue-portal

# 2. Install
npm install

# 3. Set environment variables
cp .env.example .env
# → fill in your Supabase keys

# 4. Run
npm run dev
```

### Deploy to your own Vultr server

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide.

**One-time server setup:**
```bash
bash scripts/vultr-setup.sh
```

**After that, every push to `main` auto-deploys via GitHub Actions.**

---

## 🔧 Environment variables

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📁 Project structure

```
Ue-portal/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Route pages
│   ├── lib/            # Supabase client, utils
│   └── main.tsx
├── public/
├── nginx/
│   └── ue-portal.conf  # Production Nginx config
├── scripts/
│   └── vultr-setup.sh  # One-time server setup
├── .github/
│   └── workflows/
│       └── deploy.yml  # CI/CD pipeline
├── Dockerfile          # Optional Docker deployment
├── .env.example
└── DEPLOYMENT.md       # Full deployment guide
```

---

## 📊 GitHub stats

<div align="center">

[![stats](https://github-readme-stats.vercel.app/api?username=astrax-gif&show_icons=true&theme=tokyonight&hide_border=true)](https://github.com/astrax-gif)

</div>

---

## 👨‍💻 Built by

**Abdurhman Bereket**
Software Engineering · University of Europe for Applied Sciences, Dubai

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/abdurhmanbereket/)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:abdurhmanbereket74@gmail.com)

---

![footer](https://capsule-render.vercel.app/api?type=waving&color=0:283593,100:0a0e27&height=110&section=footer)
