interface FylleLogoProps {
  size?: number;
  className?: string;
}

export default function FylleLogo({ size = 40, className = "" }: FylleLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 6-petal asterisk */}
      <g transform="translate(50,50)">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <path
            key={angle}
            d="M-8,0 L0,-42 L8,0 Z"
            fill="#4ADE80"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
    </svg>
  );
}
