import React, { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [alerts, setAlerts] = useState(["Initializing..."]);

  useEffect(() => {
    const runPose = async () => {
      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
      const video = videoRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      const detect = async () => {
        const poses = await detector.estimatePoses(video);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(video, 0, 0, 640, 480);

        if (poses.length > 0) {
          const kp = poses[0].keypoints;
          const getScore = (name) => kp.find(p => p.name === name)?.score || 0;

          const nose = getScore("nose");
          const leftEye = getScore("left_eye");
          const rightEye = getScore("right_eye");
          const leftEar = getScore("left_ear");
          const rightEar = getScore("right_ear");

          const newAlerts = [];
          if (nose < 0.3) newAlerts.push("❌ Face not visible");
          if (leftEye < 0.3 && rightEye < 0.3) newAlerts.push("❌ Eyes not visible");
          if (leftEar < 0.3 && rightEar < 0.3) newAlerts.push("❌ Possibly looking away");

          setAlerts(newAlerts.length ? newAlerts : ["✅ Monitoring OK"]);

          kp.forEach((k) => {
            if (k.score > 0.3) {
              ctx.beginPath();
              ctx.arc(k.x, k.y, 5, 0, 2 * Math.PI);
              ctx.fillStyle = "blue";
              ctx.fill();
            }
          });
        }
        requestAnimationFrame(detect);
      };
      detect();
    };

    runPose();
  }, []);

  return (
    <div style={{ position: "relative", width: "640px", height: "480px" }}>
      <video ref={videoRef} width="640" height="480" style={{ position: "absolute" }} />
      <canvas ref={canvasRef} width="640" height="480" style={{ position: "absolute" }} />
      <div style={{
        position: "absolute", top: 10, left: 10,
        background: "rgba(255,255,255,0.8)", padding: "10px", borderRadius: "8px", color: "red"
      }}>
        {alerts.map((msg, idx) => (<div key={idx}>{msg}</div>))}
      </div>
    </div>
  );
}

export default App;