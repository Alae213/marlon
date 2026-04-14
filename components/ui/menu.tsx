"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Menu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="menu" {...props} />
}

function MenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
}

function MenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="menu-group" {...props} />
}

function MenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="menu-portal" {...props} />
}

function MenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="menu-sub" {...props} />
}

function MenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />
}

const MenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(
  (
    {
      className,
      sideOffset = 4,
      collisionPadding = 8,
      avoidCollisions = true,
      ...props
    },
    ref
  ) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        data-slot="menu-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        avoidCollisions={avoidCollisions}
        className={cn(
          "z-[var(--z-menu)] min-w-[8rem] overflow-hidden rounded-md border border-[var(--menu-surface-border)] bg-[var(--menu-surface-bg)] p-1 text-[var(--menu-surface-fg)] shadow-[var(--menu-surface-shadow)] outline-hidden",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
)
MenuContent.displayName = "MenuContent"

const MenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    data-slot="menu-item"
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors",
      "hover:bg-[var(--menu-item-hover-bg)] hover:text-[var(--menu-item-hover-fg)]",
      "focus:bg-[var(--menu-item-hover-bg)] focus:text-[var(--menu-item-hover-fg)]",
      "active:bg-[var(--menu-item-active-bg)] active:text-[var(--menu-item-active-fg)]",
      "data-[disabled]:pointer-events-none data-[disabled]:text-[var(--menu-item-disabled-fg)] data-[disabled]:opacity-100",
      className
    )}
    {...props}
  />
))
MenuItem.displayName = "MenuItem"

const MenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    data-slot="menu-checkbox-item"
    checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden transition-colors",
      "hover:bg-[var(--menu-item-hover-bg)] hover:text-[var(--menu-item-hover-fg)]",
      "focus:bg-[var(--menu-item-hover-bg)] focus:text-[var(--menu-item-hover-fg)]",
      "active:bg-[var(--menu-item-active-bg)] active:text-[var(--menu-item-active-fg)]",
      "data-[disabled]:pointer-events-none data-[disabled]:text-[var(--menu-item-disabled-fg)] data-[disabled]:opacity-100",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 inline-flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
MenuCheckboxItem.displayName = "MenuCheckboxItem"

const MenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    data-slot="menu-radio-item"
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden transition-colors",
      "hover:bg-[var(--menu-item-hover-bg)] hover:text-[var(--menu-item-hover-fg)]",
      "focus:bg-[var(--menu-item-hover-bg)] focus:text-[var(--menu-item-hover-fg)]",
      "active:bg-[var(--menu-item-active-bg)] active:text-[var(--menu-item-active-fg)]",
      "data-[disabled]:pointer-events-none data-[disabled]:text-[var(--menu-item-disabled-fg)] data-[disabled]:opacity-100",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 inline-flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CircleIcon className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
MenuRadioItem.displayName = "MenuRadioItem"

const MenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    data-slot="menu-label"
    className={cn("px-2 py-1.5 text-xs font-medium text-[var(--menu-label-fg)]", className)}
    {...props}
  />
))
MenuLabel.displayName = "MenuLabel"

const MenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    data-slot="menu-separator"
    className={cn("-mx-1 my-1 h-px bg-[var(--menu-separator-bg)]", className)}
    {...props}
  />
))
MenuSeparator.displayName = "MenuSeparator"

const MenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    data-slot="menu-sub-trigger"
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors",
      "hover:bg-[var(--menu-item-hover-bg)] hover:text-[var(--menu-item-hover-fg)]",
      "focus:bg-[var(--menu-item-hover-bg)] focus:text-[var(--menu-item-hover-fg)]",
      "data-[state=open]:bg-[var(--menu-item-active-bg)] data-[state=open]:text-[var(--menu-item-active-fg)]",
      "active:bg-[var(--menu-item-active-bg)] active:text-[var(--menu-item-active-fg)]",
      "data-[disabled]:pointer-events-none data-[disabled]:text-[var(--menu-item-disabled-fg)] data-[disabled]:opacity-100",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4 opacity-70" />
  </DropdownMenuPrimitive.SubTrigger>
))
MenuSubTrigger.displayName = "MenuSubTrigger"

const MenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(
  (
    {
      className,
      sideOffset = 4,
      collisionPadding = 8,
      avoidCollisions = true,
      ...props
    },
    ref
  ) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        data-slot="menu-sub-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        avoidCollisions={avoidCollisions}
        className={cn(
          "z-[var(--z-menu)] min-w-[8rem] overflow-hidden rounded-md border border-[var(--menu-surface-border)] bg-[var(--menu-surface-bg)] p-1 text-[var(--menu-surface-fg)] shadow-[var(--menu-surface-shadow)] outline-hidden",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
)
MenuSubContent.displayName = "MenuSubContent"

function MenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-[var(--menu-shortcut-fg)]", className)}
      {...props}
    />
  )
}

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuLabel,
  MenuSeparator,
  MenuGroup,
  MenuPortal,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuRadioGroup,
  MenuShortcut,
}
