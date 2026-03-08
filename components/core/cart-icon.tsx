import React from "react";

interface CartIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const CartIcon = ({ size = 18, className, ...props }: CartIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath="url(#clip0_8_80)">
        <path
          d="M4.50014 7.5C4.37414 7.5 4.24664 7.479 4.12214 7.4355C3.53714 7.2255 3.23264 6.582 3.44114 5.997L5.31464 0.747C5.52464 0.1605 6.16814 -0.1455 6.75314 0.0659996C7.33814 0.276 7.64264 0.9195 7.43414 1.5045L5.55914 6.7545C5.39414 7.215 4.96214 7.5015 4.49864 7.5015L4.50014 7.5Z"
          fill="currentColor"
        />
        <path
          d="M13.5002 7.5C13.0382 7.5 12.6047 7.2135 12.4397 6.753L10.5647 1.503C10.3562 0.918 10.6607 0.2745 11.2457 0.0644995C11.8307 -0.144 12.4742 0.159 12.6842 0.7455L14.5592 5.9955C14.7677 6.5805 14.4632 7.224 13.8782 7.434C13.7537 7.4775 13.6262 7.5 13.5002 7.5Z"
          fill="currentColor"
        />
        <path
          d="M16.875 5.25H1.125C0.504 5.25 0 5.754 0 6.375C0 6.996 0.504 7.5 1.125 7.5H1.2855L2.247 13.752C2.559 15.78 4.2735 17.25 6.324 17.25H11.676C13.7265 17.25 15.441 15.78 15.753 13.752L16.7145 7.5H16.875C17.496 7.5 18 6.996 18 6.375C18 5.754 17.496 5.25 16.875 5.25Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_8_80">
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
