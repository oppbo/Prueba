import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Card with a title row and optional "Ver todo" link, used across dashboards. */
export function SectionCard({
  title,
  description,
  href,
  hrefLabel = "Ver todo",
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-primary hover:underline">
            {hrefLabel}
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </CardHeader>
      {children}
    </Card>
  );
}
