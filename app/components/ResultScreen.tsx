"use client";

import {
  ArrowRight,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  UserMinus,
} from "lucide-react";

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

type ResultData = {
  success: boolean;
  confidence?: number;
  message?: string;
  detail?: string;
};

type ResultScreenProps = {
  result: ResultData;
  onRetry: () => void;
  onChangeUser: () => void;
  onLogout: () => void;
};

export default function ResultScreen({
  result,
  onRetry,
  onChangeUser,
  onLogout,
}: ResultScreenProps) {
  const confidence = result.confidence ?? (result.success ? 92 : 28);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-2xl text-white">
                Resultado final
              </CardTitle>
              <CardDescription>
                Veredicto de identificación visual
              </CardDescription>
            </div>
            <Badge variant={result.success ? "success" : "destructive"}>
              {result.success ? "Acceso concedido" : "Acceso denegado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-black/60 p-6">
              <div className="relative h-40 w-40">
                <div
                  className={`hal-result-lens ${
                    result.success ? "is-success" : "is-failed"
                  }`}
                />
                <div className="absolute inset-0 grid place-items-center">
                  {result.success ? (
                    <ShieldCheck className="h-10 w-10 text-emerald-300" />
                  ) : (
                    <ShieldX className="h-10 w-10 text-red-300" />
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {result.message ??
                    (result.success
                      ? "Identidad verificada correctamente"
                      : "No se pudo verificar la identidad")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.detail ??
                    (result.success
                      ? "Coincidencia fuerte con el perfil registrado."
                      : "La coincidencia no supera el umbral requerido.")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                  <span>Nivel de coincidencia</span>
                  <span>{confidence}%</span>
                </div>
                <Progress value={confidence} className="mt-3 h-2" />
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 text-red-400" />
                  <span>
                    {result.success
                      ? "Confianza dentro del rango aceptado."
                      : "Confianza baja. Reintenta en condiciones estables."}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border border-border/70 bg-black/50 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Estado del canal</span>
                  <span className="text-emerald-300">Seguro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Iluminación estimada</span>
                  <span>{result.success ? "Óptima" : "Variable"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modo HAL</span>
                  <span>Odyssey 2001</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={onRetry} className="min-w-[160px]">
            <RefreshCw className="h-4 w-4" /> Reintentar
          </Button>
          <Button
            onClick={onChangeUser}
            variant="outline"
            className="min-w-[170px]"
          >
            <UserMinus className="h-4 w-4" /> Cambiar usuario
          </Button>
          <Button onClick={onLogout} variant="ghost" className="min-w-[150px]">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
