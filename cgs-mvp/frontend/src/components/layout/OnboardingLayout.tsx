import FylleLogo from "@/components/FylleLogo";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <FylleLogo size={44} />
      </div>

      {/* Content */}
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}
