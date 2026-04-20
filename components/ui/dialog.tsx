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

    return (
      <AnimatePresence>
        {open ? (
          <DialogPortal forceMount>
            <DialogOverlay className={overlayClassName} />
            <DialogPrimitive.Content ref={ref} asChild forceMount {...props}>
              <motion.div
                style={{
                  boxShadow: "var(--bottom-nav-shadow)",
                } as React.CSSProperties}
                className={cn(
                  "fixed left-1/2 top-1/2 z-[var(--z-dialog)] w-[calc(100%-2rem)]",
                  "max-h-[90vh] overflow-y-auto rounded-3xl border-white/10 bg-[--system-600] bg-[image:var(--gradient-popup)] p-[20px] text-white backdrop-blur-[12px]",
                  "focus:outline-none",
                  (!open || !isPresent) && "pointer-events-none",
                  size === "sm" && "max-w-[400px]",
                  size === "lg" && "max-w-[540px]",
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
        "absolute right-4 top-4 text-[var(--system-400)] hover:bg-[var(--system-100)]/10 hover:text-[var(--system-100)]",
                        closeClassName
                      )}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z" fill="white" fillOpacity="0.35"/>
            </svg>
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
      className={cn("flex flex-col gap-1 text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("w-full flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
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
    className={cn("title-xl text-[var(--system-100)]", className)}
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
    className={cn("text-body text-[var(--system-300)]", className)}
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
