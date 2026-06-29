import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export interface MentorRecommendation {
  description: string;
  name: string;
  role: string;
}

export interface MentorRecommendationCardProps {
  mentor: MentorRecommendation;
}

export function MentorRecommendationCard({
  mentor,
}: MentorRecommendationCardProps) {
  return (
    <Card className="space-y-4 p-0" variant="bordered">
      <div className="p-6 sm:p-7">
        <div className="space-y-2">
          <Heading level={2}>{mentor.name}</Heading>
          <Text className="font-medium text-zinc-700" variant="small">
            {mentor.role}
          </Text>
        </div>
        <Text className="mt-5 text-base leading-7 text-zinc-600">
          {mentor.description}
        </Text>
      </div>
    </Card>
  );
}
