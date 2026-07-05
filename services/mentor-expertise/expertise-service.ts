import { matchMentorExpertise } from "@/services/mentor-expertise/expertise-matcher";
import type {
  MatchMentorExpertiseInput,
  MentorExpertiseProfile,
} from "@/services/mentor-expertise/expertise-types";

export class MentorExpertiseService {
  findRelevantExpertise(input: MatchMentorExpertiseInput): MentorExpertiseProfile[] {
    return matchMentorExpertise(input).map((match) => match.profile);
  }
}
