import io
import os
import sys
import base64
import pathlib
import torch
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# Fix for loading models trained on Linux/Posix on Windows
if os.name == 'nt':
    pathlib.PosixPath = pathlib.WindowsPath

BASE_DIR = pathlib.Path(__file__).parent
MODEL_PATH = str(BASE_DIR / "best.pt")
LOCAL_YOLOV5 = BASE_DIR / "yolov5"

app = FastAPI(title="Bio-Medical Waste Classification API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_model():
    """Load the custom YOLOv5 model.

    Prefers a local ./yolov5 checkout; falls back to downloading
    the official ultralytics/yolov5 repo via torch.hub.
    """
    if (LOCAL_YOLOV5 / "hubconf.py").exists():
        sys.path.insert(0, str(LOCAL_YOLOV5))
        return torch.hub.load(str(LOCAL_YOLOV5), 'custom', path=MODEL_PATH, source='local')
    return torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH, trust_repo=True)


# Load Model
print("Loading YOLOv5 model...")
try:
    model = load_model()
    model.conf = 0.55
    model.iou = 0.45
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Multi-language Disposal & Risk Intelligence
DISPOSAL_INFO = {
    "en": {
        0: {
            "name": "Disposable Waste",
            "color": (238, 211, 34), "hex": "#22D3EE", "risk": "🟡 LOW RISK",
            "instructions": ["Place in YELLOW bin", "Seal in double-layered plastic bag", "Label as 'General Biomedical Waste'", "Collection schedule: Daily"]
        },
        1: {
            "name": "Pathological/Medicinal Waste",
            "color": (36, 191, 251), "hex": "#FBBF24", "risk": "🟠 MEDIUM RISK",
            "instructions": ["Incinerate or use deep burial", "Place in leak-proof YELLOW containers", "Double-bag and label as 'Biohazardous'", "Store in refrigerated area if needed"]
        },
        2: {
            "name": "Sharps/Glass",
            "color": (133, 113, 251), "hex": "#FB7185", "risk": "🔴 HIGH RISK",
            "instructions": ["Use puncture-proof WHITE/BLUE containers", "Disinfect with 1% hypochlorite before disposal", "Never overfill sharps containers (max 3/4 full)", "Do not recap needles manually"]
        },
        3: {
            "name": "Radioactive Waste",
            "color": (248, 140, 129), "hex": "#818CF8", "risk": "☢️ CRITICAL RISK",
            "instructions": ["Store in lead-lined containers", "Allow to decay for 10 half-lives", "Consult Radiation Safety Officer for disposal", "Use Geiger counter to verify safe levels"]
        }
    },
    "hi": {
        0: {
            "name": "डिस्पोजेबल कचरा (Disposable Waste)",
            "color": (238, 211, 34), "hex": "#22D3EE", "risk": "🟡 कम जोखिम (LOW)",
            "instructions": ["पीले कूड़ेदान में रखें", "दोहरी परत वाले प्लास्टिक बैग में सील करें", "सामान्य बायोमेडिकल कचरे के रूप में लेबल करें", "संग्रह अनुसूची: दैनिक"]
        },
        1: {
            "name": "रोग संबंधी/औषधीय कचरा",
            "color": (36, 191, 251), "hex": "#FBBF24", "risk": "🟠 मध्यम जोखिम (MEDIUM)",
            "instructions": ["भस्मीकरण या गहरे दफन का उपयोग करें", "लीक-प्रूफ पीले कंटेनरों में रखें", "डबल-बैग और 'बायोहैजर्डस' के रूप में लेबल करें", "जरूरत पड़ने पर रेफ्रिजेरेटेड क्षेत्र में स्टोर करें"]
        },
        2: {
            "name": "नुकीला/कांच कचरा (Sharps)",
            "color": (133, 113, 251), "hex": "#FB7185", "risk": "🔴 उच्च जोखिम (HIGH)",
            "instructions": ["पंचर-प्रूफ सफेद/नीले कंटेनरों का उपयोग करें", "निपटान से पहले 1% हाइपोक्लोराइट से कीटाणुरहित करें", "कंटेनरों को कभी भी 3/4 से ज्यादा न भरें", "सुइयों को मैन्युअल रूप से रीकैप न करें"]
        },
        3: {
            "name": "रेडियोधर्मी कचरा",
            "color": (248, 140, 129), "hex": "#818CF8", "risk": "☢️ गंभीर जोखिम (CRITICAL)",
            "instructions": ["सीसा-lined कंटेनरों में स्टोर करें", "सुरक्षित स्तरों को सत्यापित करने के लिए गीगर काउंटर का उपयोग करें", "निपटान के लिए विकिरण सुरक्षा अधिकारी से परामर्श करें", "क्षय के लिए पर्याप्त समय दें"]
        }
    },
    "mr": {
        0: {
            "name": "डिस्पोजेबल कचरा (Disposable Waste)",
            "color": (238, 211, 34), "hex": "#22D3EE", "risk": "🟡 कमी जोखीम (LOW)",
            "instructions": ["पिवळ्या कचरा कुंडीत ठेवा", "दुहेरी थराच्या प्लास्टिक पिशवीत सीलबंद करा", "सामान्य बायोमेडिकल कचरा म्हणून लेबल लावा", "संकलन वेळापत्रक: दररोज"]
        },
        1: {
            "name": "पॅथॉलॉजिकल/औषधी कचरा",
            "color": (36, 191, 251), "hex": "#FBBF24", "risk": "🟠 मध्यम जोखीम (MEDIUM)",
            "instructions": ["भस्मीकरण करा किंवा खोल जमिनीत गाडून टाका", "गळती-प्रतिरोधक पिवळ्या कंटेनरमध्ये ठेवा", "बायोहॅजर्डस म्हणून लेबल लावून डबल-बॅग करा", "गरज असल्यास थंड जागी साठवा"]
        },
        2: {
            "name": "अणकुचीदार वस्तू/काच (Sharps)",
            "color": (133, 113, 251), "hex": "#FB7185", "risk": "🔴 उच्च जोखीम (HIGH)",
            "instructions": ["पंक्चर-प्रूफ पांढऱ्या/निळ्या कंटेनरचा वापर करा", "विल्हेवाट लावण्यापूर्वी १% हायपोक्लोराईटने निर्जंतूक करा", "कंटेनर पाऊण (३/४) पेक्षा जास्त भरू नका", "सुयांना हाताने टोपण लावू नका"]
        },
        3: {
            "name": "किरणोत्सर्गी कचरा",
            "color": (248, 140, 129), "hex": "#818CF8", "risk": "☢️ गंभीर जोखीम (CRITICAL)",
            "instructions": ["शिसे असलेल्या (Lead-lined) कंटेनरमध्ये साठवा", "विल्हेवाट लावण्यासाठी विकिरण सुरक्षा अधिकाऱ्याचा सल्ला घ्या", "सुरक्षितता तपासण्यासाठी गिगर काउंटरचा वापर करा", "किरणोत्सर्ग कमी होण्यासाठी वेळ द्या"]
        }
    }
}

def draw_colored_boxes(img, df, lang="en"):
    """Custom drawing to ensure boxes match our legend colors."""
    img_cv = np.array(img)
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)
    
    lang_info = DISPOSAL_INFO.get(lang, DISPOSAL_INFO["en"])
    
    for _, row in df.iterrows():
        x1, y1, x2, y2 = int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax'])
        class_id = int(row['class'])
        conf = row['confidence']
        
        info = lang_info.get(class_id, DISPOSAL_INFO["en"][0])
        color = info["color"]
        # Use English name for internal labels to avoid encoding issues in OpenCV draw if fonts are missing
        # But we can try to use localized name if possible. Let's stick to English for the box label for safety.
        label = f"{DISPOSAL_INFO['en'][class_id]['name']} {conf:.2f}"
        
        # Draw Box
        cv2.rectangle(img_cv, (x1, y1), (x2, y2), color, 3)
        
        # Draw Label Background
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        cv2.rectangle(img_cv, (x1, y1 - 25), (x1 + w, y1), color, -1)
        cv2.putText(img_cv, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
    return cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)

@app.post("/detect")
async def detect(file: UploadFile = File(...), conf: float = Form(0.55), lang: str = Form("en")):
    if model is None:
        return {"error": "Model initialization failed."}
    
    # Update confidence
    model.conf = conf
    
    # Read Image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # Inference
    results = model(image)
    df = results.pandas().xyxy[0]
    
    # Custom Rendering
    rendered_np = draw_colored_boxes(image, df, lang)
    rendered_img = Image.fromarray(rendered_np)
    
    # Convert to Base64 for the frontend
    buffered = io.BytesIO()
    rendered_img.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    # Prepare Detections & Disposal Info
    detections = []
    summary = {}
    
    lang_info = DISPOSAL_INFO.get(lang, DISPOSAL_INFO["en"])
    
    if not df.empty:
        for class_id in df['class'].unique():
            cls_id = int(class_id)
            cls_df = df[df['class'] == class_id]
            avg_conf = cls_df['confidence'].mean()
            count = len(cls_df)
            
            info = lang_info.get(cls_id, {})
            category_name = info.get("name", f"Class {cls_id}")
            
            summary[category_name] = {
                "count": count,
                "avg_confidence": float(avg_conf),
                "hex": info.get("hex", "#FFFFFF"),
                "risk": info.get("risk", "UNKNOWN"),
                "instructions": info.get("instructions", [])
            }
            
        for _, row in df.iterrows():
            cls_idx = int(row['class'])
            detections.append({
                "class": cls_idx,
                "name": lang_info.get(cls_idx, {}).get("name", "Unknown"),
                "confidence": float(row['confidence']),
                "bbox": [float(row['xmin']), float(row['ymin']), float(row['xmax']), float(row['ymax'])]
            })

    return {
        "image": f"data:image/jpeg;base64,{img_str}",
        "detections": detections,
        "summary": summary
    }

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
