import { cn } from '@/lib/utils';

export interface CampaignStep {
  id: string;
  label: string;
}

interface CampaignStepperProps {
  steps: CampaignStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function CampaignStepper({ steps, currentStep, onStepClick }: CampaignStepperProps) {
  return (
    <ol className="grid gap-3 md:grid-cols-7">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <li key={step.id}>
            <button
              type="button"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                isActive
                  ? 'border-zinc-300 bg-zinc-100 text-zinc-900'
                  : isCompleted
                    ? 'border-emerald-700/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400',
                onStepClick ? 'cursor-pointer' : 'cursor-default',
              )}
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
            >
              <p className="text-xs font-semibold">Step {index + 1}</p>
              <p className="mt-1 text-xs">{step.label}</p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

