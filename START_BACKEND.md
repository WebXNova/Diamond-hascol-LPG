# How to Start Backend Server

## The Error Explained

`ERR_CONNECTION_REFUSED` means:
- The backend server is **NOT running**
- The frontend is trying to connect to `http://localhost:5000` but nothing is listening on that port
- This is **NOT a CORS issue** - the server needs to be started first

## Steps to Start Backend

1. **Open a terminal/command prompt**

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   OR if you have nodemon installed:
   ```bash
   npx nodemon server.js
   ```

4. **You should see output like:**
   ```
   ✅ Environment validation passed
   ✅ Database connection established successfully
   ✅ Database schema synced
   🚀 Server is running on port 5000
   ✅ Server and database are ready
   ```

5. **Keep this terminal open** - the server must stay running

## Verify Server is Running

- Open browser: `http://localhost:5000/health`
- Should return: `{"status":"ok","timestamp":"..."}`

## Common Issues

1. **Port 5000 already in use:**
   - Change PORT in `.env` file: `PORT=5001`
   - Or kill the process using port 5000

2. **Database connection error:**
   - Check `.env` file has correct database credentials
   - Make sure MySQL/database is running

3. **Missing dependencies:**
   - Run: `npm install` in backend directory

## After Starting Server

Once the backend is running, refresh your frontend page and the products should load!




