"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { Button } from "@/components/ui/button";

const DialogOpenContext = createContext(false);

function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  ...props
}: DialogPrimitive.DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen;

  return (
    <DialogOpenContext.Provider value={open}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogOpenContext.Provider>
  );
}

const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const open = useContext(DialogOpenContext);
  const isPresent = useIsPresent();

  return (
    <DialogPrimitive.Overlay ref={ref} asChild forceMount {...props}>
      <motion.div
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-[color:rgb(0_0_0_/_0.01)]",
          (!open || !isPresent) && "pointer-events-none",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={open ? springs.slow : springs.moderate}
      />
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = "DialogOverlay";

interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: "sm" | "lg";
  overlayClassName?: string;
  showCloseButton?: boolean;
  closeClassName?: string;
}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      className,
      children,
      size = "sm",
      overlayClassName,
      showCloseButton = true,
      closeClassName,
      ...props
    },
    ref
  ) => {
    const open = useContext(DialogOpenContext);
    const isPresent = useIsPresent();
    const shape = useShape();

    return (
      <AnimatePresence>
        {open ? (
          <DialogPortal forceMount>
            <DialogOverlay className={overlayClassName} />
            <DialogPrimitive.Content ref={ref} asChild forceMount {...props}>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-[var(--z-dialog)] w-[calc(100%-2rem)]",
                  "max-h-[90vh] overflow-y-auto border border-[var(--color-border)] bg-[var(--color-card)] p-[var(--spacing-lg)] text-[var(--color-card-foreground)]",
                  "shadow-[var(--shadow-xl)] focus:outline-none",
                  (!open || !isPresent) && "pointer-events-none",
                  size === "sm" && "max-w-[400px]",
                  size === "lg" && "max-w-[540px]",
                  shape.container,
                  className
                )}
                initial={{ opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }}
                animate={{
                  opacity: open ? 1 : 0,
                  scale: open ? 1 : 0.97,
                  x: "-50%",
                  y: "-50%",
                }}
                exit={{ opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }}
                transition={open ? springs.slow : springs.moderate}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        "absolute right-[var(--spacing-md)] top-[var(--spacing-md)] text-[var(--system-400)] hover:bg-[var(--system-100)] hover:text-[var(--system-700)]",
                        closeClassName
                      )}
                    >
                      <X />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPortal>
        ) : null}
      </AnimatePresence>
    );
  }
);
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-[var(--spacing-md)] flex flex-col gap-1 text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-[var(--spacing-md)] flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const DialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-title text-[var(--system-700)]", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-body-sm text-[var(--system-400)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
