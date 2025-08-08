
"use client";

import * as React from "react";
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

interface AdminAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthSuccess: () => void;
}

export function AdminAuthDialog({ isOpen, onOpenChange, onAuthSuccess }: AdminAuthDialogProps) {
  const { toast } = useToast();
  
  const handleAuthentication = () => {
    toast({
      title: "Permissão Concedida",
      description: "Você pode adicionar um novo item.",
    });
    onAuthSuccess();
    onOpenChange(false);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Autenticação de Administrador</DialogTitle>
          <DialogDescription>
            É necessária a permissão de um administrador para adicionar um novo item ao inventário.
            Clique em 'Continuar' para prosseguir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleAuthentication}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
