import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({ className, imageClassName, priority = false }: BrandLogoProps) {
  return (
    <div className={cn("relative h-8 w-full", className)}>
      <Image
        src="/logo/EidynBlackTheme.png"
        alt="Eidyn"
        priority={priority}
        className={cn("object-contain object-left dark:invert dark:brightness-0", imageClassName)}
        fill
        sizes="(max-width: 768px) 112px, 124px"
      />
    </div>
  );
}