import { matchMentorMethods } from "@/services/mentor-methods/method-matcher";
import type {
  MatchMentorMethodsInput,
  MentorMethod,
} from "@/services/mentor-methods/method-types";

export class MentorMethodService {
  findRelevantMethods(input: MatchMentorMethodsInput): MentorMethod[] {
    return matchMentorMethods(input).map((match) => match.method);
  }
}
