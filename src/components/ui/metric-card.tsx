import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const metricCardVariants = cva(
  "transition-all duration-300 hover:shadow-xl hover:scale-[1.02] backdrop-blur-sm border border-white/20",
  {
    variants: {
      variant: {
        default: "bg-white/80 dark:bg-gray-900/80 shadow-lg hover:shadow-2xl",
        primary: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white shadow-blue-500/25 hover:shadow-blue-500/40",
        success: "bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40",
        warning: "bg-gradient-to-br from-amber-500/90 to-amber-600/90 text-white shadow-amber-500/25 hover:shadow-amber-500/40",
        info: "bg-gradient-to-br from-cyan-500/90 to-cyan-600/90 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40",
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
        className={cn(metricCardVariants({ variant, className }), "relative overflow-hidden group")}
        ref={ref}
        {...props}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <p className={cn(
                "text-sm font-medium tracking-wide uppercase",
                variant === "default" ? "text-muted-foreground" : "text-current/80"
              )}>
                {title}
              </p>
              <p className={cn(
                "text-4xl font-bold tracking-tight",
                variant === "default" ? "text-foreground" : "text-current"
              )}>
                {value}
              </p>
              {change && (
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    changeType === "positive" ? "bg-emerald-500" : 
                    changeType === "negative" ? "bg-red-500" : "bg-gray-400"
                  )}></div>
                  <p className={cn("text-sm font-medium", getChangeColor())}>
                    {change}
                  </p>
                </div>
              )}
            </div>
            {icon && (
              <div className={cn(
                "ml-4 p-4 rounded-2xl transition-all duration-300 group-hover:scale-110",
                variant === "default" 
                  ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300" 
                  : "bg-white/20 text-current backdrop-blur-sm"
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