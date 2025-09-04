import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[var(--color-sanvi-primary-100)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-sanvi-primary-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h1>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {description || "This feature is currently under development and will be available soon. We're working hard to bring you the best experience."}
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => router.push('/admin')}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}