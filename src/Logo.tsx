/** The site logo. Same drawing as public/logo.svg (the favicon), with the empty margin cropped. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="76 54 360 390" aria-hidden="true">
      <path d="M195 64H317L256 138Z" fill="#22B6EE" />
      <path d="M256 64H317L256 138Z" fill="#057FCB" />
      <path d="M256 160 86 434 192 375 256 267Z" fill="#59D9FF" />
      <path d="M256 160 256 267 320 375 426 434Z" fill="#149DE9" />
      <path d="M86 434H426L320 375H192Z" fill="#2578BD" />
    </svg>
  );
}
