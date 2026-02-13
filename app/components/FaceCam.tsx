"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import {
  Camera,
  Loader2,
  ScanFace,
  ShieldCheck,
  ShieldX,
  Zap,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";

type FaceResult = {
  success: boolean;
  confidence?: number;
  message?: string;
  detail?: string;
};

type FaceCamProps = {
  onComplete: (result: FaceResult) => void;
};

type Attempt = {
  id: string;
  success: boolean;
  confidence: number;
  timestamp: number;
};

const THRESHOLD = 0.55;
const MODEL_URL = "/models";

export default function FaceCam({ onComplete }: FaceCamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [modelsState, setModelsState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [modelsProgress, setModelsProgress] = useState(0);

  const [cameraState, setCameraState] = useState<
    "idle" | "pending" | "ready" | "error"
  >("idle");

  const [scanState, setScanState] = useState<
    "idle" | "scanning" | "detected" | "verified" | "rejected"
  >("idle");
  const [scanProgress, setScanProgress] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("face_descriptor_demo");
    setHasRegistered(Boolean(stored));
  }, []);

  useEffect(() => {
    void loadModels();
    return () => {
      stopCamera();
      if (modelTimerRef.current) clearInterval(modelTimerRef.current);
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  async function loadModels() {
    try {
      setError(null);
      setModelsState("loading");
      setModelsProgress(12);

      if (modelTimerRef.current) clearInterval(modelTimerRef.current);
      modelTimerRef.current = setInterval(() => {
        setModelsProgress((prev) => (prev < 90 ? Math.min(prev + 6, 90) : prev));
      }, 250);

      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      setModelsProgress(100);
      setModelsState("ready");
      if (modelTimerRef.current) clearInterval(modelTimerRef.current);
    } catch (e) {
      console.error(e);
      setModelsState("error");
      setError(
        "No se pudieron cargar los modelos. Verifica la carpeta /public/models."
      );
    }
  }

  async function startCamera() {
    try {
      setError(null);
      setCameraState("pending");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        void videoRef.current?.play();
        setCameraState("ready");
      };
    } catch (e) {
      console.error(e);
      setCameraState("error");
      setError(
        "No se pudo acceder a la cámara. Revisa los permisos del navegador."
      );
    }
  }

  function stopCamera() {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function drawFrameToCanvas() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return false;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setError("La cámara aún no está lista. Espera un segundo y reintenta.");
      return false;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    ctx.drawImage(video, 0, 0, width, height);
    return true;
  }

  function startScanProgress() {
    setScanProgress(10);
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev === null) return 30;
        return prev < 92 ? prev + 5 : prev;
      });
    }, 200);
  }

  function stopScanProgress() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setScanProgress(100);
    setTimeout(() => setScanProgress(null), 700);
  }

  async function detectFace() {
    if (modelsState !== "ready") {
      setError("Modelos no cargados todavía.");
      return null;
    }

    if (cameraState !== "ready") {
      setError("La cámara aún no está lista.");
      return null;
    }

    const ok = drawFrameToCanvas();
    if (!ok) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    return faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  async function registerFace() {
    setError(null);
    setInfo(null);
    setConfidence(null);
    setScanState("scanning");
    startScanProgress();

    const detection = await detectFace();
    if (!detection) {
      setScanState("idle");
      stopScanProgress();
      if (cameraState === "ready" && modelsState === "ready") {
        setError("No se detectó ningún rostro. Ajusta la iluminación.");
      }
      return;
    }

    const descriptor = Array.from(detection.descriptor);
    localStorage.setItem("face_descriptor_demo", JSON.stringify(descriptor));
    setHasRegistered(true);
    setScanState("detected");
    stopScanProgress();
    setInfo("Registro completado. Tu rostro está listo para verificarse.");
  }

  async function verifyFace() {
    if (!hasRegistered) {
      setError("No hay identidad registrada. Realiza el registro primero.");
      return;
    }

    setError(null);
    setInfo(null);
    setConfidence(null);
    setScanState("scanning");
    startScanProgress();

    const detection = await detectFace();
    if (!detection) {
      setScanState("idle");
      stopScanProgress();
      if (cameraState === "ready" && modelsState === "ready") {
        setError("No se detectó rostro para la verificación.");
      }
      return;
    }

    setScanState("detected");
    await new Promise((resolve) => setTimeout(resolve, 250));

    const stored = localStorage.getItem("face_descriptor_demo");
    if (!stored) {
      setScanState("idle");
      stopScanProgress();
      setError("No se encontró un rostro registrado.");
      return;
    }

    const storedDescriptor = JSON.parse(stored) as number[];
    const currentDescriptor = Array.from(detection.descriptor);
    const d = euclideanDistance(storedDescriptor, currentDescriptor);
    const similarity = Math.max(0, Math.min(1, 1 - d / THRESHOLD));
    const confidenceValue = Math.round(similarity * 100);
    const success = d < THRESHOLD;

    setConfidence(confidenceValue);
    setScanState(success ? "verified" : "rejected");
    stopScanProgress();

    setAttempts((prev) =>
      [
        {
          id: `${Date.now()}`,
          success,
          confidence: confidenceValue,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 4)
    );

    const message = success
      ? "Verificación exitosa. Bienvenido."
      : "No se pudo verificar tu identidad.";

    const detail = success
      ? "Coincidencia alta con el perfil registrado."
      : "Coincidencia insuficiente. Reintenta con mejor iluminación.";

    setInfo(success ? message : null);
    setError(success ? null : message);

    onComplete({
      success,
      confidence: confidenceValue,
      message,
      detail,
    });
  }

  function resetRegisteredFace() {
    localStorage.removeItem("face_descriptor_demo");
    setHasRegistered(false);
    setError(null);
    setInfo("Registro borrado. Puedes registrar una nueva identidad.");
    setConfidence(null);
    setScanState("idle");
  }

  function euclideanDistance(a: number[], b: number[]) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
  }

  const statusText = useMemo(() => {
    if (modelsState === "loading") return "Modelos cargando…";
    if (modelsState === "error") return "Modelos con error";
    if (cameraState === "pending") return "Permiso de cámara pendiente";
    if (cameraState === "error") return "Cámara bloqueada";
    if (scanState === "scanning") return "Buscando rostro…";
    if (scanState === "detected") return "Rostro detectado";
    if (scanState === "verified") return "Verificado";
    if (scanState === "rejected") return "No verificado";
    if (cameraState === "ready" && modelsState === "ready") return "Cámara lista";
    return "Sistema en reposo";
  }, [cameraState, modelsState, scanState]);

  const statusVariant = useMemo<
    "success" | "destructive" | "warning" | "secondary"
  >(() => {
    if (scanState === "verified") return "success";
    if (scanState === "rejected" || cameraState === "error") return "destructive";
    if (scanState === "scanning" || modelsState === "loading") return "warning";
    return "secondary";
  }, [cameraState, modelsState, scanState]);

  const signalLevel = useMemo(() => {
    if (confidence === null) return 0;
    return Math.min(4, Math.max(1, Math.ceil(confidence / 25)));
  }, [confidence]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-2xl text-white">
                Identificación visual
              </CardTitle>
              <CardDescription>
                Protocolo HAL 9000 • verificación sin contraseña
              </CardDescription>
            </div>
            <Badge variant={statusVariant}>{statusText}</Badge>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-red-400" />
                Núcleo neural
              </span>
              <span className="h-1 w-1 rounded-full bg-red-500/70" />
              <span>Canal seguro</span>
            </div>
            {modelsState === "loading" && (
              <Progress value={modelsProgress} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/80 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-6 rounded-2xl border border-red-500/40">
                <div className="absolute -left-2 -top-2 h-6 w-6 border-l-2 border-t-2 border-red-500" />
                <div className="absolute -right-2 -top-2 h-6 w-6 border-r-2 border-t-2 border-red-500" />
                <div className="absolute -left-2 -bottom-2 h-6 w-6 border-l-2 border-b-2 border-red-500" />
                <div className="absolute -right-2 -bottom-2 h-6 w-6 border-r-2 border-b-2 border-red-500" />
              </div>

              {scanState === "scanning" && (
                <div className="hal-scanline" aria-hidden="true" />
              )}

              <div className="absolute inset-0 grid place-items-center">
                <div className="hal-lens-ring" />
              </div>
            </div>

            {cameraState !== "ready" && (
              <div className="absolute inset-0 grid place-items-center bg-black/70 text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/50">
                    <Camera className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Activa la cámara para iniciar el protocolo.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
                <span>
                  {cameraState === "ready"
                    ? "Señal estable"
                    : "Señal inactiva"}
                </span>
              </div>
              <div className="flex items-end gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={[
                      "w-1.5 rounded-sm transition-all",
                      level <= signalLevel ? "bg-emerald-400" : "bg-white/20",
                      level === 1 ? "h-2" : "",
                      level === 2 ? "h-3" : "",
                      level === 3 ? "h-4" : "",
                      level === 4 ? "h-5" : "",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button
            onClick={startCamera}
            disabled={cameraState === "ready" || cameraState === "pending"}
            className="min-w-[180px]"
          >
            {cameraState === "pending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Conectando cámara
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" /> Iniciar cámara
              </>
            )}
          </Button>
          <Button
            onClick={verifyFace}
            variant="outline"
            disabled={
              modelsState !== "ready" ||
              cameraState !== "ready" ||
              scanState === "scanning"
            }
            className="min-w-[200px]"
          >
            <ScanFace className="h-4 w-4" />
            Iniciar identificación
          </Button>
          <Button
            onClick={registerFace}
            variant="secondary"
            disabled={
              modelsState !== "ready" ||
              cameraState !== "ready" ||
              scanState === "scanning"
            }
            className="min-w-[170px]"
          >
            Registrar rostro
          </Button>
          <Button onClick={resetRegisteredFace} variant="ghost">
            Borrar registro
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Estado del sistema
            </CardTitle>
            <CardDescription>
              Seguimiento visual del proceso de identificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Modelos IA</span>
              <Badge
                variant={
                  modelsState === "ready"
                    ? "success"
                    : modelsState === "error"
                      ? "destructive"
                      : "warning"
                }
              >
                {modelsState === "ready"
                  ? "Listos"
                  : modelsState === "error"
                    ? "Error"
                    : "Cargando"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Identidad</span>
              <Badge variant={hasRegistered ? "success" : "warning"}>
                {hasRegistered ? "Registrada" : "Pendiente"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cámara</span>
              <Badge
                variant={
                  cameraState === "ready"
                    ? "success"
                    : cameraState === "error"
                      ? "destructive"
                      : "warning"
                }
              >
                {cameraState === "ready"
                  ? "Lista"
                  : cameraState === "error"
                    ? "Bloqueada"
                    : "Esperando"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Detección facial
              </span>
              <Badge
                variant={
                  scanState === "verified"
                    ? "success"
                    : scanState === "rejected"
                      ? "destructive"
                      : scanState === "scanning"
                        ? "warning"
                        : "secondary"
                }
              >
                {scanState === "scanning"
                  ? "Buscando rostro"
                  : scanState === "detected"
                    ? "Rostro detectado"
                    : scanState === "verified"
                      ? "Verificado"
                      : scanState === "rejected"
                        ? "No verificado"
                        : "En espera"}
              </Badge>
            </div>
            {scanProgress !== null && (
              <Progress value={scanProgress} className="h-2" />
            )}
            {confidence !== null && (
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                  <span>Coincidencia</span>
                  <span>{confidence}%</span>
                </div>
                <Progress value={confidence} className="mt-2 h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {(error || info) && (
          <Alert variant={error ? "destructive" : "default"}>
            <AlertTitle>{error ? "Atención" : "Sistema"}</AlertTitle>
            <AlertDescription>{error ?? info}</AlertDescription>
          </Alert>
        )}

        {cameraState === "error" && (
          <Alert variant="warning">
            <AlertTitle>Permiso de cámara requerido</AlertTitle>
            <AlertDescription>
              {showHelp ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    1. Haz clic en el icono de la cámara en la barra del
                    navegador.
                  </p>
                  <p>2. Permite el acceso para este sitio.</p>
                  <p>3. Recarga la página y vuelve a intentar.</p>
                </div>
              ) : (
                <span>
                  La cámara está bloqueada. Necesitamos acceso para continuar.
                </span>
              )}
            </AlertDescription>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowHelp((prev) => !prev)}
              >
                {showHelp ? "Ocultar ayuda" : "Ver ayuda"}
              </Button>
            </div>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Intentos recientes
            </CardTitle>
            <CardDescription>
              Historial corto de verificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attempts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Aún no hay intentos registrados.
              </div>
            ) : (
              attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {attempt.success ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-red-400" />
                    )}
                    <span>
                      {attempt.success ? "Acceso permitido" : "Acceso denegado"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {attempt.confidence}%
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
