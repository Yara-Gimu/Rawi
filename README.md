# 🎙️ RAWI (رِواي) | AI-Powered Cultural Tourism Guide

**Rawi** is an advanced, cloud-native tourism assistant designed to showcase the rich heritage of the **Asir region** in Saudi Arabia. Built with a focus on high availability, scalability, and modern DevOps practices, Rawi leverages Generative AI to provide immersive storytelling for travelers.

---

## 🏗️ System Architecture & Tech Stack

* **Cloud Hosting:** Deployed on **Render** using **Docker** containers for consistent environments.
* **Database:** Powered by **Supabase (PostgreSQL)** for real-time, cloud-based data management.
* **AI Engine:** Integrated with **Google Gemini 2.5 Flash** for high-speed, culturally nuanced Arabic content generation.
* **DevOps (CI/CD):** Fully automated deployment pipeline via **GitHub Actions**.
* **Infrastructure as Code (IaC):** Includes **Terraform** blueprints for future-proof cloud infrastructure.

---

## ✨ Key Features

* **Smart Concierge:** An AI chatbot that answers cultural queries based on authentic heritage data.
* **Admin Dashboard:** A custom CMS to manage landmarks and view real-time interaction metrics.
* **Cross-Platform UI:** Responsive design tailored for both tourists on mobile and admins on desktop.
* **Zero-Maintenance Scaling:** Leveraging serverless and containerized services for 99.9% uptime.

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Yara-Gimu/Rawi.git

```


2. **Install dependencies:**
```bash
pip install -r requirements.txt

```


3. **Configure Environment Variables:**
Create a `.env` file with your credentials:
* `SUPABASE_URL`
* `SUPABASE_KEY`
* `GEMINI_API_KEY`



---

## 🚀 Deployment (CI/CD)

This project is configured for **Continuous Integration and Continuous Deployment**. Every push to the `main` branch triggers a **GitHub Action** that:

1. Verifies code integrity.
2. Triggers a deployment hook to **Render**.
3. Updates the live production environment automatically.

---

## 👤 Author

**Yara Ali Abdullah Al-Alawi** Final year student at **King Abdulaziz University** (Faculty of Computing and Information Technology).
