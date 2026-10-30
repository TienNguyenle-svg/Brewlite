import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: IconProps) => (
  <Icon {...p}><path d="M5 12l5 5L20 7" /></Icon>
);
export const IconCoffee = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 14c.8 1.2 2 2 3.5 2h6c1.5 0 2.7-.8 3.5-2V8H3z" />
    <path d="M17 9h1a2 2 0 0 1 0 5h-1M6 20h10M7 4v1M10 4v1M13 4v1" />
  </Icon>
);
export const IconMapPin = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="10" r="2.5" />
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
  </Icon>
);
export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
);
export const IconShoppingBag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 7h12l1 13H5z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </Icon>
);
export const IconBuildingStore = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 9l1.5-5h15L21 9M3 9v1a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9M5 13v7h14v-7M10 20v-4h4v4" />
  </Icon>
);
export const IconNavigation = (p: IconProps) => (
  <Icon {...p}><path d="M3 11l18-8-8 18-2-8z" /></Icon>
);
export const IconMessageCircle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8.5 19z" />
  </Icon>
);
