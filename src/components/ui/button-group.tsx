import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", size, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex -space-x-px",
          orientation === "vertical" ? "flex-col -space-x-0 -space-y-px" : "flex-row",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const element = child as React.ReactElement<any>;
            return React.cloneElement(element, {
              // @ts-ignore
              variant: element.props.variant || variant,
              // @ts-ignore
              size: element.props.size || size,
              // @ts-ignore
              className: cn(
                element.props.className,
                "rounded-none first:rounded-l-md last:rounded-r-md focus:z-10",
                orientation === "horizontal"
                  ? ""
                  : ""
              ),
            })
          }
          return child
        })}
      </div>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }
