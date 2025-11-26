import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompletionDialogProps {
  open: boolean;
  onClose: () => void;
  cycleCount: number;
}

export const CompletionDialog = ({ open, onClose, cycleCount }: CompletionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-sm">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-light text-center text-foreground">
            Beautiful work!
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground space-y-2">
            <p className="text-lg font-medium text-foreground">You completed {cycleCount} {cycleCount === 1 ? 'cycle' : 'cycles'} of box breathing.</p>
            <p>Your mind and body thank you.</p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button
            onClick={onClose}
            className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
