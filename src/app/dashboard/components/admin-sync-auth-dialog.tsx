
"use client";

import * as React from "react";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";

interface AdminSyncAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthSuccess: (credential: any) => void;
}

export function AdminSyncAuthDialog({ isOpen, onOpenChange, onAuthSuccess }: AdminSyncAuthDialogProps) {
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (result.user.email !== "phenrique646@gmail.com") {
        toast({
            title: "Authentication Failed",
            description: "Only the admin user (phenrique646@gmail.com) can sync the spreadsheet.",
            variant: "destructive",
        });
        setIsAuthenticating(false);
        onOpenChange(false);
        return
      }

      onAuthSuccess(credential);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        setIsAuthenticating(false);
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Administrative Authentication</DialogTitle>
          <DialogDescription>
            Permission from an administrator is required to sync the spreadsheet.
            Please log in with a valid Google account.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p className="text-sm text-muted-foreground">
                You will be prompted to sign in with your Google account to authorize access to Google Sheets.
                For this demo, please use `phenrique646@gmail.com` as the user.
            </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGoogleSignIn} disabled={isAuthenticating}>
            {isAuthenticating ? "Authenticating..." : "Login with Google"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
