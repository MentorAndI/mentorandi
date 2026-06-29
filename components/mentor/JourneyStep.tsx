import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export interface JourneyStepProps {
  actionHref?: string;
  actionLabel?: string;
  body: string[];
  heading: string;
  headingId: string;
}

export function JourneyStep({
  actionHref,
  actionLabel,
  body,
  heading,
  headingId,
}: JourneyStepProps) {
  return (
    <div className="space-y-8">
      <Heading
        className="max-w-xl text-4xl sm:text-5xl"
        id={headingId}
        level={1}
      >
        {heading}
      </Heading>
      <div className="space-y-5">
        {body.map((paragraph) => (
          <Text className="text-lg leading-8 text-zinc-700" key={paragraph}>
            {paragraph}
          </Text>
        ))}
      </div>
      {actionHref && actionLabel ? (
        <Button className="sm:min-w-40" href={actionHref}>
          {actionLabel}
        </Button>
      ) : actionLabel ? (
        <Button className="sm:min-w-48" type="button">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
