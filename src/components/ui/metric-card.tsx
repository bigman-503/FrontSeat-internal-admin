import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const metricCardVariants = cva(
  "transition-all duration-200 hover:shadow-medium",
  {
    variants: {
      variant: {
        default: "bg-gradient-card border-border",
        primary: "bg-gradient-primary text-dashboard-primary-foreground border-dashboard-primary/20",
        success: "bg-gradient-success text-dashboard-success-foreground border-dashboard-success/20",
        warning: "bg-dashboard-warning text-dashboard-warning-foreground border-dashboard-warning/20",
        info: "bg-dashboard-info text-dashboard-info-foreground border-dashboard-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, variant, title, value, change, changeType = "neutral", icon, ...props }, ref) => {
    const getChangeColor = () => {
      if (variant === "primary" || variant === "success" || variant === "warning" || variant === "info") {
        return "text-current opacity-80";
      }
      switch (changeType) {
        case "positive":
          return "text-dashboard-success";
        case "negative":
          return "text-destructive";
        default:
          return "text-muted-foreground";
      }
    };

    return (
      <Card
        className={cn(metricCardVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium tracking-wide",
                variant === "default" ? "text-muted-foreground" : "text-current opacity-90"
              )}>
                {title}
              </p>
              <p className={cn(
                "text-3xl font-bold mt-2",
                variant === "default" ? "text-foreground" : "text-current"
              )}>
                {value}
              </p>
              {change && (
                <p className={cn("text-sm mt-2 font-medium", getChangeColor())}>
                  {change}
                </p>
              )}
            </div>
            {icon && (
              <div className={cn(
                "ml-4 p-3 rounded-lg",
                variant === "default" ? "bg-muted text-muted-foreground" : "bg-black/10 text-current"
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
MetricCard.displayName = "MetricCard";

export { MetricCard, metricCardVariants };