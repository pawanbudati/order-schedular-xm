# BingX Order Scheduler - Frontend (GitHub Pages Deployable)

Standalone React + TypeScript + Vite frontend for the BingX High-Precision Order Scheduler.

## 🚀 GitHub Pages Deployment Steps

1. **Push to your GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Deploy BingX Scheduler Frontend"
   git remote add origin https://github.com/YOUR_USERNAME/bingx-scheduler-frontend.git
   git push -u origin main
   ```

2. **Deploy to GitHub Pages:**
   - Go to **Repository Settings** ➔ **Pages**.
   - Under **Source**, select **GitHub Actions** or select branch `main` folder `/dist`.
   - Build output will be served automatically at `https://YOUR_USERNAME.github.io/bingx-scheduler-frontend/`.

3. **Connecting to your GCP VM Backend:**
   - In the deployed Web UI, click **API Settings** in the top right.
   - Enter your GCP VM Backend URL in the **Backend API Server URL** field (e.g. `http://YOUR_GCP_VM_IP:3001/api` or `https://api.yourdomain.com/api`).
   - Click **Save**.
