/**
 * SurveySection — conditionally renders the readiness survey.
 *
 * Preserves the original gating logic: only shows if there's an active survey
 * AND the athlete hasn't responded today.
 */

import { getActiveSurvey, hasRespondedToday } from "@/server/actions/surveys";
import QuickSurvey from "@/components/atleta/QuickSurvey";

export async function SurveySection() {
  const [survey, alreadyResponded] = await Promise.all([
    getActiveSurvey("READINESS"),
    hasRespondedToday("READINESS"),
  ]);

  if (!survey || alreadyResponded) return null;

  return <QuickSurvey survey={survey} />;
}
