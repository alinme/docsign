"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const itemVariants = {
  default: "border-transparent bg-card",
  outline: "border-border bg-card",
};

const itemSizes = {
  default: "gap-4 px-4 py-3 rounded-lg",
  sm: "gap-3 px-3 py-2 rounded-md",
};

interface ItemProps extends React.ComponentProps<"div"> {
  variant?: keyof typeof itemVariants;
  size?: keyof typeof itemSizes;
  asChild?: boolean;
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-slot="item"
        className={cn(
          "flex w-full items-center border text-left transition-colors",
          itemVariants[variant],
          itemSizes[size],
          asChild && "cursor-pointer hover:bg-muted/50 [&:has([data-slot=item-actions]_button)]:cursor-default",
          className
        )}
        {...props}
      />
    );
  }
);
Item.displayName = "Item";

function ItemMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-media"
      className={cn("flex shrink-0 items-center justify-center text-muted-foreground [.item-icon]:size-5", className)}
      {...props}
    />
  );
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-content" className={cn("min-w-0 flex-1", className)} {...props} />;
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("font-semibold leading-none text-foreground truncate", className)}
      {...props}
    />
  );
}

function ItemDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-description"
      className={cn("mt-1 text-sm text-muted-foreground truncate", className)}
      {...props}
    />
  );
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle };
