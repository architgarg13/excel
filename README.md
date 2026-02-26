# Excel Insight

A full-stack web application for uploading and analyzing Excel files. Upload `.xlsx` or `.xls` files to view worksheet names and column headers with a modern, responsive UI.

## Tech Stack

- **Frontend**: Vue.js 3, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Multer, xlsx
- **Database**: MongoDB (via Mongoose)
- **Infrastructure**: Docker

## Getting Started

### Docker (Recommended)

```bash
cd excel-insight
docker-compose up --build
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

### Local Development

**Backend:**

```bash
cd backend
npm install
npm run dev
```

Requires a MongoDB instance at `mongodb://localhost:27017/excel-insight`.

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

## Features

- Drag & drop or click-to-browse Excel file upload
- Real-time upload progress bar
- File validation (type and size)
- Worksheet listing with expandable accordion for column headers
- Click-to-copy headers
- Dark mode toggle (persisted)
- Responsive layout
