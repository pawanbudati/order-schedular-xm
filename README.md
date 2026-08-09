# XM360 Order Scheduler - Frontend (GitHub Pages Deployable)

Standalone React + TypeScript + Vite frontend for the XM360 High-Precision Order Scheduler.

## 🚀 GitHub Pages Deployment Steps

1. **Push to your GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Deploy XM360 Scheduler Frontend"
   git remote add origin https://github.com/pawanbudati/order-schedular-xm.git
   git push -u origin main
   ```

2. **Deploy to GitHub Pages:**
   - Go to **Repository Settings** ➔ **Pages**.
   - Under **Source**, select **GitHub Actions**.
   - Build output will be served automatically at `https://pawanbudati.github.io/bingx-scheduler-xm/`.

3. **Connecting to your GCP VM Backend:**
   - In the deployed Web UI, click **API Settings** in the top right.
   - Enter your GCP VM Backend URL in the **Backend API Server URL** field (e.g. `http://YOUR_GCP_VM_IP:3001/api`).
   - Click **Save**.
