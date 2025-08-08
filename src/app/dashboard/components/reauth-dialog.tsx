"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ReauthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export function ReauthDialog({ isOpen, onOpenChange, onSuccess }: ReauthDialogProps) {
  const { reauthenticate } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await reauthenticate(password);
      toast({ title: "Autenticação confirmada!", variant: "success" });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Falha na autenticação",
        description: "A palavra-passe está incorreta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmação de Segurança</DialogTitle>
          <DialogDescription>
            Para continuar com esta ação, por favor, introduza a sua palavra-passe novamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password"className="text-right">
              Palavra-passe
            </Label>
            <Input
              id="password"
              type="password"
              className="col-span-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isLoading || !password}>
            {isLoading ? "A confirmar..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}