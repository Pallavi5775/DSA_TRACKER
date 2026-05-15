# DSA Revision Planner

## Architecture

- **Backend** — FastAPI on port 8000 (uvicorn)
- **Frontend** — React (Vite) served as static files by Nginx
- **Domain** — https://dsa-planner.co.in

---

## Deploy React Frontend (First Time)

### 1. Local — build and push

```bash
cd frontend-react
npm install
npm run build          # creates frontend-react/dist/

cd ..
git add frontend-react/
git commit -m "React frontend build"
git push
```

### 2. Server — pull the build

```bash
cd ~/DSA_TRACKER
git pull
```

### 3. Server — fix Nginx permissions (one time only)

```bash
chmod o+x /root
chmod -R o+r ~/DSA_TRACKER/frontend-react/dist
```

### 4. Server — update Nginx config

```bash
sudo nano /etc/nginx/sites-available/dsa
```

Replace the `location /` block with:

```nginx
location / {
    root /root/DSA_TRACKER/frontend-react/dist;
    try_files $uri $uri/ /index.html;
}
```

Keep the `location /api/` block unchanged.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Server — start the backend

```bash
sudo fuser -k 8000/tcp
nohup uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

---

## Redeploy After Changes

```bash
# Local
cd frontend-react
npm run build
cd ..
git add frontend-react/dist
git commit -m "rebuild"
git push

# Server
cd ~/DSA_TRACKER
git pull
# Nginx picks up static files automatically — no reload needed
```

If backend code changed:

```bash
sudo fuser -k 8000/tcp
nohup uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

---

## Useful Commands

```bash
# Check backend is running
ps aux | grep uvicorn

# Nginx logs
sudo tail -n 50 /var/log/nginx/error.log

# Reload Nginx (after config changes only)
sudo nginx -t && sudo systemctl reload nginx

# Check backend log
tail -f ~/DSA_TRACKER/backend.log
```
npm run build 
git add frontend-react/dist 
git commit -m "rebuild" 
git push