# ☁️ Cloud Drive — Cloud Storage Based Distributed Media Archive

A full-stack cloud storage web application for uploading, managing, previewing, and securely sharing files — built with React.js, Node.js/Express.js, Supabase Storage, and MongoDB Atlas.

**Live Demo:** [cloud-drive-smoky.vercel.app](https://cloud-drive-smoky.vercel.app)

## Features

- 📤 **File Upload** — drag-and-drop or click-to-browse upload for any file type
- 🗂️ **File Management** — card-based grid view with preview, copy-link, and delete actions
- 👁️ **Inline Preview** — native browser preview for images and PDFs
- 📊 **Real-Time Storage Tracking** — live progress bar showing consumed vs. total storage quota
- 🔗 **Shareable Links** — every upload gets a permanent public URL
- ⏱️ **File Transfer (15-Minute Expiry)** — generate time-bound shareable links using UUID tokens that automatically expire after 15 minutes, with server-side validation and a live countdown timer
- 🎨 **Glassmorphism UI** — fully responsive design with a modern, semi-transparent aesthetic

## Tech Stack

**Frontend**
- React.js — component-based UI with virtual DOM rendering
- HTML5 / CSS3 — semantic structure and glassmorphism styling
- JavaScript (ES6+) — tab navigation, async API calls, countdown timers

**Backend**
- Node.js + Express.js — REST API server
- Multer — multipart file upload handling
- Mongoose — ODM for MongoDB Atlas
- uuid — cryptographically random tokens for transfer links

**Storage & Database**
- Supabase Storage — object storage for uploaded files, returns public URLs
- MongoDB Atlas — stores file metadata (name, size, type, URL, timestamps)

**Deployment**
- Frontend: [Vercel](https://vercel.com)
- Backend: [Render](https://render.com)

## Architecture

Three-tier full-stack architecture:

Tier 1 — Presentation: React.js Frontend (Browser)
Tier 2 — Application: Node.js + Express.js REST API
Tier 3 — Data: Supabase Storage (files) + MongoDB Atlas (metadata)


**Upload flow:** Browser → POST /api/upload (multipart) → Multer buffers file → Supabase Storage returns public URL → metadata saved to MongoDB → response sent back to frontend.

## API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/upload` | Uploads a file to Supabase, saves metadata to MongoDB, returns public URL |
| `GET /api/files` | Retrieves all file metadata for display |
| `DELETE /api/files/:id` | Deletes a file from both Supabase and MongoDB atomically |
| `POST /api/transfer` | Generates a UUID transfer token with 15-minute expiry |
| `GET /api/transfer/:token` | Validates token and returns file URL, or `410 Gone` if expired |

## Getting Started

### Prerequisites

- Node.js and npm installed
- A [Supabase](https://supabase.com) project (Storage bucket)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Installation

```bash
git clone https://github.com/sumanthmohan17/cloud-drive.git
cd cloud-drive
```

Install dependencies for both frontend and backend:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend` folder:

PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=your_bucket_name


**Never commit your `.env` file** — it should already be listed in `.gitignore`.

### Running Locally

Start the backend:

```bash
cd backend
npm start
```

Start the frontend (in a separate terminal):

```bash
cd frontend
npm start
```

## Project Structure

cloud-drive/
├── backend/ # Express server, API routes, Mongoose models, Supabase integration
├── frontend/ # React application (Home, My Files, File Transfer, About)
└── .gitignore


## Future Scope

- User authentication and multi-tenancy (JWT-based)
- Folder/directory support for nested organization
- Adjustable transfer link expiry durations
- One-time-use download links
- File versioning
- Data deduplication via content hashing
- Analytics dashboard for storage/usage insights

## Team

Built as a Mini Project (23CS605) at Malnad College of Engineering, Hassan, under the guidance of **Ms. Bimba Prasad**, Assistant Professor, Dept. of CSE.

- Ritish Sharma
- **Sumanth Mohan** — [GitHub](https://github.com/sumanthmohan17) | [LinkedIn](https://www.linkedin.com/in/sumanth-mohan-452104295/)
- Tejaswi B N
- Jeevan Y R
