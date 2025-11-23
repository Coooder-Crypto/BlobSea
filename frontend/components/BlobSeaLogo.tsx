type Props = {
  className?: string;
};

export default function BlobSeaLogo({ className = "h-12 w-12" }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8 8H24V24H8V8Z" fill="#22d3ee" />
      <path d="M6 10H8V22H6V10Z" fill="#22d3ee" />
      <path d="M24 10H26V22H24V10Z" fill="#22d3ee" />
      <path d="M10 6H22V8H10V6Z" fill="#22d3ee" />
      <path d="M6 12H26V16H6V12Z" fill="#111111" />
      <path d="M8 13H14V15H8V13Z" fill="#c084fc" />
      <path d="M20 13H22V14H20V13Z" fill="#c084fc" />
      <path d="M10 22V27H12V28H14V22H10Z" fill="white" />
      <path d="M18 22V28H20V27H22V22H18Z" fill="white" />
      <path d="M10 22H14V23H10V22Z" fill="#ddd" />
      <path d="M18 22H22V23H18V22Z" fill="#ddd" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 6V4H22V6H24V8H26V10H28V22H26V24H22V22H20V28H18V22H14V28H12V22H10V24H6V22H4V10H6V8H8V6H10ZM8 8V10H6V22H8V24H12V23H14V24H18V23H20V24H24V22H26V10H24V8H8V6H10V8H8Z"
        fill="#050505"
        fillOpacity="0.2"
      />
    </svg>
  );
}
