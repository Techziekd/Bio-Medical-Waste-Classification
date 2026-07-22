# 🏥 Bio-Medical Waste Classification System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![YOLOv5](https://img.shields.io/badge/YOLOv5-Custom_Trained-FF6B6B?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**An AI-powered, real-time biomedical waste detection and safety audit platform built for healthcare environments.**

[Features](#-key-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Waste Categories](#-waste-categories) · [Screenshots](#-screenshots)

</div>

---

## 🎯 Problem Statement

Improper biomedical waste disposal is a critical global health hazard, responsible for thousands of infections annually among healthcare workers and waste handlers. Manual classification is slow, error-prone, and inconsistent. This system automates waste identification using computer vision, provides instant safety guidance, and maintains an audit trail — reducing risk and ensuring regulatory compliance.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Detection** | Real-time YOLOv5 detection across 4 WHO-standard waste categories |
| 📸 **Dual Input Mode** | Upload images OR use live camera feed for continuous monitoring |
| 🎨 **Color-Coded Boxes** | Category-specific bounding boxes (Cyan / Amber / Rose / Indigo) |
| ⚠️ **Risk Assessment** | Automated risk level (Low → Critical) per detected item |
| 📋 **Disposal Protocols** | Step-by-step WHO-compliant disposal instructions per waste type |
| 🌓 **Light/Dark Mode** | Glassmorphism UI with full theme support |
| 📊 **Session Audit Log** | Detection history with timestamps for compliance tracking |
| 🔧 **Sensitivity Control** | Adjustable confidence threshold for detection precision |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                  │
│         Tailwind CSS + Lucide Icons + Glassmorphism       │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (multipart/form-data)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Python)                 │
│         Image preprocessing · NMS · Response builder     │
└──────────────────────┬──────────────────────────────────┘
                       │  PyTorch inference
                       ▼
┌─────────────────────────────────────────────────────────┐
│              YOLOv5 Custom-Trained Model                  │
│    best.pt · 4 classes · Real-time object detection       │
└─────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Backend:** FastAPI, Python 3.10+, PyTorch, OpenCV, PIL
- **Model:** YOLOv5 with custom-trained weights (`best.pt`)
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
- **Comms:** REST API, multipart form uploads, base64 image responses

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js v18+
- npm

### 1. Clone the Repository
```bash
git clone https://github.com/Techziekd/Bio-Medical-Waste-Classification.git
cd Bio-Medical-Waste-Classification
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python server.py
```
Server runs at → `http://localhost:8000`

> **Note:** On first run, the YOLOv5 engine is downloaded automatically via `torch.hub`
> (internet required once). Alternatively, clone it manually into the project root:
> `git clone https://github.com/ultralytics/yolov5.git`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard available at → `http://localhost:3000`

### 4. Classic Native Mode (Fastest Live Camera)
If you prefer a standalone native OS window without the browser:
```bash
python main.py
```
> Press `q` to safely exit the live camera window.

### 5. Environment (optional)
```bash
# .env (if you add any config)
MODEL_PATH=best.pt
CONFIDENCE_THRESHOLD=0.55
```

---

## 🏷️ Waste Categories

The system classifies waste into 4 categories based on **WHO Biomedical Waste Management Guidelines**:

| # | Category | Color | Risk Level | Disposal Method |
|---|---|---|---|---|
| 0 | ✅ **Disposable Waste** | 🩵 Cyan | 🟡 LOW | Yellow bin, sealed plastic bag |
| 1 | ⚠️ **Pathological/Medicinal** | 🟡 Amber | 🟠 MEDIUM | Incineration, licensed disposal |
| 2 | 🔥 **Sharps/Glass** | 🔴 Rose | 🔴 HIGH | Puncture-proof red container |
| 3 | ☢️ **Radioactive Waste** | 🟣 Indigo | ☢️ CRITICAL | Lead-lined container, specialist handler |

---

## 📂 Project Structure

```
Bio-Medical-Waste-Classification/
│
├── frontend/                   # React (Vite) Dashboard
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── App.jsx             # Main application
│   │   └── index.css           # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── yolov5/                     # YOLOv5 core engine (optional — auto-downloaded if absent)
│
├── server.py                   # FastAPI backend server
├── main.py                     # Native OpenCV live detection script
├── best.pt                     # Custom trained model weights
├── requirements.txt            # Python dependencies
└── BMW Report.pdf              # Project research report
```

---

## 📡 API Reference

### `POST /detect`
Detect waste in an uploaded image.

**Request:**
```
Content-Type: multipart/form-data
Body: file (image), conf (float, default: 0.55)
```

**Response:**
```json
{
  "image": "data:image/jpeg;base64,<string>",
  "detections": [
    {
      "class": 2,
      "name": "Sharps/Glass",
      "confidence": 0.61,
      "bbox": [x1, y1, x2, y2]
    }
  ],
  "summary": {
    "Sharps/Glass": {
      "count": 3,
      "avg_confidence": 0.58,
      "hex": "#FB7185",
      "risk": "🔴 HIGH RISK",
      "instructions": ["..."]
    }
  }
}
```

---

## 🧠 Model Details

- **Architecture:** YOLOv5s (small — optimized for speed)
- **Classes:** 4 (Disposable, Pathological, Sharps/Glass, Radioactive)
- **Input size:** 640×640
- **Training:** Custom dataset, data augmentation (flip, mosaic, HSV shift)
- **Inference:** ~30ms per image on CPU

---

## 🔮 Roadmap

- [ ] Multi-object tracking for live video streams
- [ ] Compliance report PDF export
- [ ] Mobile-responsive PWA
- [x] Multi-language support (Hindi, Marathi for Indian healthcare)
- [ ] Integration with hospital waste management APIs

---

## 👩💻 Author

**Nikita Dung** — Software Developer · Mumbai
[LinkedIn](https://linkedin.com/in/nikitadung) · [GitHub](https://github.com/NikitaD27) · dungnikita27@gmail.com

---

## 📜 License

© 2026 Nikita Dung. All rights reserved.
