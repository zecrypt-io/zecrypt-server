// components/WelcomeModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslator } from "@/hooks/use-translations";
import { Shield, Lock, Check } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function WelcomeModal({ isOpen, onClose, onContinue }: WelcomeModalProps) {
  const { translate } = useTranslator();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
            <Shield className="h-8 w-8" />
          </div>
        </div>
        
        <DialogHeader className="pt-8 pb-2">
          <DialogTitle className="text-2xl text-center font-bold">
            {translate("welcome_to_zecrypt", "dashboard")}
          </DialogTitle>
          <DialogDescription className="text-center px-4 py-2">
            {translate("welcome_message", "dashboard", {
              message:
                "Welcome to Zecrypt! We're thrilled to have you here. To get started, please create your first project to securely manage your credentials and data.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Features highlights */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="bg-primary/10 rounded-full p-1.5 mt-0.5">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">
                  {translate("secure_storage", "features")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("secure_storage_desc", "features", {
                    message: "Store all your passwords and sensitive data with military-grade encryption."
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="bg-primary/10 rounded-full p-1.5 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">
                  {translate("organization", "features")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("organization_desc", "features", {
                    message: "Organize credentials into projects for better management and quick access."
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="sm:order-1 order-2 w-full sm:w-auto"
          >
            {translate("later", "dashboard")}
          </Button>
          <Button 
            onClick={onContinue} 
            className="sm:order-2 order-1 w-full sm:w-auto gap-2"
          >
            <Shield className="h-4 w-4" />
            {translate("create_first_project", "dashboard", {
              message: "Create Your First Project"
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}