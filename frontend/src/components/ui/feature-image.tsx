import React from "react";

export const FeatureImage = ({
  src,
  darkSrc = "/mail2.png",
  alt = "app screen",
}: {
  src: string;
  darkSrc?: string;
  alt?: string;
}) => {
  return (
    <div className="flex-1 w-full inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
      <img
        className="bg-background aspect-15/8 relative hidden w-full h-auto object-cover rounded-2xl dark:block"
        src={darkSrc}
        alt={alt}
      />
      <img
        className="z-2 border-border/25 aspect-15/8 relative w-full h-auto object-cover rounded-2xl border dark:hidden"
        src={src}
        alt={alt}
      />
    </div>
  );
};
