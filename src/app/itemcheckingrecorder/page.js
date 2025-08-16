"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import styles from "./ItemCheckingRecorder.module.css";

// Helper function outside component
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function ItemCheckingRecorder() {
  // State management
  const [formData, setFormData] = useState({
    sackNumber: "",
    itemCode: "",
    dateDelivered: "",
    dateChecked: "",
    supplierName: "",
    checkedBy: ""
  });
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [cameraError, setCameraError] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sackNumberError, setSackNumberError] = useState("");

  // Refs for media handling
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunks = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const animationRef = useRef(null);
  const autoStopTimerRef = useRef(null);

  // Set default dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      dateDelivered: today,
      dateChecked: today
    }));
  }, []);

  // Camera initialization and cleanup
  useEffect(() => {
    const enableCamera = async () => {
      try {
        const constraints = { 
          video: { width: 1280, height: 720, facingMode: "environment" }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraError(false);
      } catch (error) {
        handleCameraError(error);
      }
    };

    const handleCameraError = (error) => {
      const errorMessages = {
        'NotAllowedError': "Camera access denied. Please enable camera permissions.",
        'NotFoundError': "No camera found on this device.",
        'NotReadableError': "Camera is already in use by another application.",
        'default': "Failed to access camera: " + error.message
      };
      
      toast.error(errorMessages[error.name] || errorMessages.default);
      setCameraError(true);
    };

    enableCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationRef.current);
      clearTimeout(autoStopTimerRef.current);
      clearInterval(timerRef.current);
      
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
    };
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'sackNumber') {
      const validPattern = /^(C-|D-|IMP-)/i;
      setSackNumberError(
        value && !validPattern.test(value) 
          ? "Sack number must start with C-, D- or IMP-" 
          : ""
      );
    }
  };

  // Clear form inputs
  const clearInputs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      sackNumber: "",
      itemCode: "",
      dateDelivered: today,
      dateChecked: today,
      supplierName: "",
      checkedBy: ""
    });
  }, []);

  // Draw video and overlay to canvas
  const drawToCanvas = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Update canvas dimensions if needed
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw overlay if recording
    if (recordingStatus !== 'idle') {
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      
      const textLines = [
        `Sack Number: ${formData.sackNumber}`,
        `Item Code: ${formData.itemCode}`,
        `Date Delivered: ${formData.dateDelivered}`,
        `Date Checked: ${formData.dateChecked}`,
        `Supplier: ${formData.supplierName}`,
        `Checked By: ${formData.checkedBy}`
      ];
      
      const padding = 20;
      const lineHeight = 30;
      
      textLines.forEach((line, i) => {
        const yPos = canvas.height - padding - (textLines.length - i - 1) * lineHeight;
        ctx.strokeText(line, padding, yPos);
        ctx.fillText(line, padding, yPos);
      });
    }
    
    animationRef.current = requestAnimationFrame(drawToCanvas);
  }, [recordingStatus, formData]);

  // Initialize canvas drawing
  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      animationRef.current = requestAnimationFrame(drawToCanvas);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [drawToCanvas]);

  // Audio feedback functions
  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 300);
    } catch (error) {
      console.error("Beep sound error:", error);
    }
  }, []);

  // Recording control functions
  const startRecording = useCallback(() => {
    if (recordingStatus !== 'idle' || !streamRef.current) return;
    
    setRecordingStatus('recording');
    setRecordingTime(0);
    playBeep();

    // Recording timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // Auto-stop after 10 minutes
    autoStopTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      clearInterval(timerRef.current);
      setRecordingStatus('idle');
      toast("Recording automatically stopped after 10 minutes", { icon: "⏱️" });
    }, 600000);

    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm",
        videoBitsPerSecond: 2000000
      });

      chunks.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        clearInterval(timerRef.current);
        clearTimeout(autoStopTimerRef.current);
        
        if (chunks.current.length === 0) return;

        try {
          const blob = new Blob(chunks.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          // Generate filename
          const formattedDateDelivered = formData.dateDelivered.replace(/-/g, '');
          const formattedDateChecked = formData.dateChecked.replace(/-/g, '');
          const safeSupplier = formData.supplierName.replace(/[^a-z0-9]/gi, '_').toUpperCase();
          const safeCheckedBy = formData.checkedBy.replace(/[^a-z0-9]/gi, '_').toUpperCase();
          
          a.download = `${formData.sackNumber}_${formData.itemCode}_${formattedDateDelivered}_${safeSupplier}_CHECKED_BY_${safeCheckedBy}_CHECKED_DATE_${formattedDateChecked}.webm`;
          
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            chunks.current = [];
          }, 100);
          
          toast.success("Recording saved!");
          clearInputs();
        } catch (error) {
          console.error("Error processing video:", error);
          toast.error("Failed to process recording");
        }
      };

      mediaRecorderRef.current.start(100);
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Failed to start recording");
      setRecordingStatus('idle');
      clearInterval(timerRef.current);
      clearTimeout(autoStopTimerRef.current);
    }
  }, [recordingStatus, formData, playBeep, clearInputs]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      clearInterval(timerRef.current);
      playBeep();
      toast("Recording paused", { icon: "⏸️" });
    }
  }, [playBeep]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      playBeep();
      toast("Recording resumed", { icon: "▶️" });
    }
  }, [playBeep]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      playBeep();
      clearInterval(timerRef.current);
      clearTimeout(autoStopTimerRef.current);
      setRecordingStatus('idle');
    }
  }, [playBeep]);

  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && recordingStatus === 'idle') {
      startRecording();
    }
  };

  // Form validation
  const isFormValid = () => {
    return (
      formData.sackNumber &&
      formData.itemCode &&
      formData.dateDelivered &&
      formData.dateChecked &&
      formData.supplierName &&
      formData.checkedBy &&
      !sackNumberError
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Item Checking Recorder</h1>
        <div className={styles.recordingStatus}>
          {recordingStatus === 'recording' && (
            <div className={styles.recordingIndicator}>
              <span className={styles.recordingDot}>●</span> 
              Recording: {formatTime(recordingTime)}
            </div>
          )}
          {recordingStatus === 'paused' && (
            <div className={styles.pausedIndicator}>
              <span className={styles.pausedIcon}>⏸</span> 
              Paused: {formatTime(recordingTime)}
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Sack Number *</label>
            <input
              type="text"
              value={formData.sackNumber}
              onChange={(e) => handleInputChange('sackNumber', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan or enter sack number (C-, D- or IMP- prefix)"
              className={`${styles.inputField} ${sackNumberError ? styles.error : ''}`}
              disabled={recordingStatus !== 'idle'}
              autoFocus
            />
            {sackNumberError && <div className={styles.errorMessage}>{sackNumberError}</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Item Code *</label>
            <input
              type="text"
              value={formData.itemCode}
              onChange={(e) => handleInputChange('itemCode', e.target.value)}
              placeholder="Enter item code"
              className={styles.inputField}
              disabled={recordingStatus !== 'idle'}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Date Delivered *</label>
            <input
              type="date"
              value={formData.dateDelivered}
              onChange={(e) => handleInputChange('dateDelivered', e.target.value)}
              className={styles.inputField}
              disabled={recordingStatus !== 'idle'}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Date Checked *</label>
            <input
              type="date"
              value={formData.dateChecked}
              onChange={(e) => handleInputChange('dateChecked', e.target.value)}
              className={styles.inputField}
              disabled={recordingStatus !== 'idle'}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Supplier Name *</label>
            <input
              type="text"
              value={formData.supplierName}
              onChange={(e) => handleInputChange('supplierName', e.target.value)}
              placeholder="Enter supplier name"
              className={styles.inputField}
              disabled={recordingStatus !== 'idle'}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Checked By *</label>
            <input
              type="text"
              value={formData.checkedBy}
              onChange={(e) => handleInputChange('checkedBy', e.target.value)}
              placeholder="Enter your name"
              className={styles.inputField}
              disabled={recordingStatus !== 'idle'}
            />
          </div>

          <div className={styles.controls}>
            {recordingStatus === 'idle' ? (
              <button 
                onClick={startRecording} 
                className={styles.recordButton}
                disabled={!isFormValid()}
              >
                Start Recording (Enter)
              </button>
            ) : recordingStatus === 'recording' ? (
              <>
                <button 
                  onClick={pauseRecording} 
                  className={styles.pauseButton}
                >
                  ⏸ Pause
                </button>
                <button 
                  onClick={stopRecording} 
                  className={styles.stopButton}
                >
                  ⏹ Stop
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={resumeRecording} 
                  className={styles.resumeButton}
                >
                  ▶ Resume
                </button>
                <button 
                  onClick={stopRecording} 
                  className={styles.stopButton}
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.videoSection}>
          {cameraError ? (
            <div className={styles.cameraError}>
              <span className={styles.errorIcon}>❌</span>
              <p>Camera access blocked. Enable in browser settings</p>
            </div>
          ) : (
            <div className={styles.videoWrapper}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={styles.videoFeed}
                style={{ display: 'none' }}
              />
              <canvas 
                ref={canvasRef} 
                className={styles.videoFeed}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}