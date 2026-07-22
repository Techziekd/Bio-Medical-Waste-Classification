import cv2
import torch
import os
import sys
import pathlib

# Fix for loading models trained on Linux/Posix on Windows
if os.name == 'nt':
    pathlib.PosixPath = pathlib.WindowsPath

BASE_DIR = pathlib.Path(__file__).parent
MODEL_PATH = str(BASE_DIR / "best.pt")
LOCAL_YOLOV5 = BASE_DIR / "yolov5"


def load_model():
    """Load the custom YOLOv5 model.

    Prefers a local ./yolov5 checkout; falls back to downloading
    the official ultralytics/yolov5 repo via torch.hub.
    """
    if (LOCAL_YOLOV5 / "hubconf.py").exists():
        sys.path.insert(0, str(LOCAL_YOLOV5))
        return torch.hub.load(str(LOCAL_YOLOV5), 'custom', path=MODEL_PATH, source='local')
    return torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH, trust_repo=True)


# Load YOLOv5 model
print("Loading YOLOv5 custom model...")
try:
    model = load_model()
    model.conf = 0.55  # Set confidence threshold
    model.iou = 0.45   # NMS IoU threshold
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

# Multi-language Disposal & Risk Intelligence (English Default for OpenCV)
DISPOSAL_INFO = {
    0: {
        "name": "Disposable",
        "color": (238, 211, 34),  # Cyan in RGB
        "bgr_color": (34, 211, 238), # Cyan in BGR format for OpenCV
        "risk": "LOW RISK"
    },
    1: {
        "name": "Pathological",
        "color": (36, 191, 251),  # Gold
        "bgr_color": (251, 191, 36),
        "risk": "MEDIUM RISK"
    },
    2: {
        "name": "Sharps/Glass",
        "color": (133, 113, 251),  # Rose
        "bgr_color": (251, 113, 133),
        "risk": "HIGH RISK"
    },
    3: {
        "name": "Radioactive",
        "color": (248, 140, 129),  # Indigo
        "bgr_color": (129, 140, 248),
        "risk": "CRITICAL RISK"
    }
}

def draw_overlay(frame, df):
    """Draw bounding boxes and a side dashboard summary on the OpenCV frame."""
    
    summary_counts = {0: 0, 1: 0, 2: 0, 3: 0}
    
    # Draw boxes
    for _, row in df.iterrows():
        x1, y1, x2, y2 = int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax'])
        class_id = int(row['class'])
        conf = row['confidence']
        
        info = DISPOSAL_INFO.get(class_id, DISPOSAL_INFO[0])
        color = info["bgr_color"]
        
        summary_counts[class_id] += 1
        
        # Bounding Box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        
        # Label
        label = f"{info['name']} {conf:.2f}"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - 20), (x1 + w, y1), color, -1)
        cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

    # Draw Summary Sidebar Background (semi-transparent)
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (250, frame.shape[0]), (20, 20, 20), -1)
    frame = cv2.addWeighted(overlay, 0.8, frame, 0.2, 0)
    
    # Write Summary Text
    cv2.putText(frame, "BIO MEDICAL WASTE", (15, 30), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(frame, "Live Safety Audit", (15, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)
    cv2.line(frame, (15, 60), (235, 60), (100, 100, 100), 1)
    
    y_offset = 90
    for class_id, count in summary_counts.items():
        if count > 0:
            info = DISPOSAL_INFO[class_id]
            color = info["bgr_color"]
            
            # Draw Color Indicator Dot
            cv2.circle(frame, (25, y_offset - 5), 5, color, -1)
            
            # Write Category Name & Count
            cv2.putText(frame, f"{info['name']}: {count}", (40, y_offset - 1), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            cv2.putText(frame, info["risk"], (40, y_offset + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.35, color, 1, cv2.LINE_AA)
            
            y_offset += 45
            
    cv2.putText(frame, "Press 'q' to Quit", (15, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 100, 255), 1, cv2.LINE_AA)
        
    return frame

def main():
    print("Opening Webcam...")
    cap = cv2.VideoCapture(0)
    
    # Attempt to set higher resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("Live Detection Started. Press 'q' in the video window to stop.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break
            
        # Convert BGR (OpenCV) to RGB (YOLOv5 input expected format)
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Inference
        results = model(img_rgb)
        df = results.pandas().xyxy[0]
        
        # Draw Overlays
        annotated_frame = draw_overlay(frame, df)
        
        # Display Result
        cv2.imshow("Bio Medical Waste Scanner", annotated_frame)
        
        # Exit Condition
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    print("Live Detection Stopped.")

if __name__ == "__main__":
    main()
