import { matchMentorSources } from "@/services/mentor-sources/source-matcher";
import type {
  MatchMentorSourcesInput,
  MentorSourceCard,
} from "@/services/mentor-sources/source-types";

export class MentorSourceService {
  findRelevantSourceCards(input: MatchMentorSourcesInput): MentorSourceCard[] {
    return matchMentorSources(input).map((match) => match.card);
  }
}
