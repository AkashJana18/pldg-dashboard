'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ProcessedData, EngagementData, GitHubData } from '@/types/dashboard';
import { Download, TrendingUp, TrendingDown, Users, GitPullRequest, Star, Target, Activity, ThumbsUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { calculateEngagementScore } from '@/lib/utils';

interface Props {
  data: ProcessedData;
  onExport: () => void;
}

const METRIC_EXPLANATIONS = {
  weeklyChange: "Percentage change in total contributions compared to last week. Calculated from both GitHub and Airtable data.",
  activeContributors: "Number of unique contributors who submitted at least one contribution in the current week.",
  totalContributions: "Total number of issues, PRs, and technical contributions across all tech partners.",
  npsScore: "Net Promoter Score (range: -100 to 100) calculated from weekly engagement surveys.",
  engagementRate: "Percentage of contributors actively participating in program activities and submissions.",
  activeTechPartners: "Number of tech partners with at least one active contribution or engagement this week."
};

export default function ExecutiveSummary({ data, onExport }: Props) {
  const insights = React.useMemo(() => {
    const totalActiveContributors = data.activeContributors;
    const totalContributions = data.totalContributions;
    const weeklyChange = data.weeklyChange;
    const nps = data.programHealth.npsScore;
    const engagementRate = data.programHealth.engagementRate;
    const activeTechPartners = data.programHealth.activeTechPartners;

    // Calculate positive feedback from feedbackSentiment
    const positiveFeedback = data.feedbackSentiment.positive;

    return {
      weeklyChange: {
        issues: weeklyChange,
        contributors: totalActiveContributors,
        partners: activeTechPartners
      },
      programHealth: {
        nps,
        engagementRate,
        totalContributions
      },
      keyHighlights: [
        `${totalActiveContributors} active contributors across ${activeTechPartners} tech partners`,
        `${totalContributions} total contributions`,
        `${positiveFeedback} positive feedback responses`,
        `${Math.abs(Math.round(weeklyChange))}% ${weeklyChange >= 0 ? 'increase' : 'decrease'} in weekly contributions`
      ]
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>PLDG Cohort Performance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Key metrics and program health indicators
            </p>
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Weekly Performance Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Weekly Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {insights.weeklyChange.issues >= 0 ? (
                    <TrendingUp className="text-green-500" size={20} />
                  ) : (
                    <TrendingDown className="text-red-500" size={20} />
                  )}
                  <span>
                    {Math.round(Math.abs(insights.weeklyChange.issues))}% WoW
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{METRIC_EXPLANATIONS.weeklyChange}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="text-blue-500" size={20} />
                <span>{insights.weeklyChange.contributors} Active Contributors</span>
              </div>
              <div className="flex items-center gap-3">
                <GitPullRequest className="text-purple-500" size={20} />
                <span>{insights.programHealth.totalContributions} Total Contributions</span>
              </div>
            </div>
          </div>

          {/* Program Health Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Program Health</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} />
                  <span>NPS Score: {insights.programHealth.nps}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{METRIC_EXPLANATIONS.npsScore}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="text-green-500" size={20} />
                <span>Engagement Rate: {insights.programHealth.engagementRate}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="text-blue-500" size={20} />
                <span>Active Tech Partners: {insights.weeklyChange.partners}</span>
              </div>
            </div>
          </div>

          {/* Key Highlights Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Key Highlights</h3>
            <div className="space-y-3">
              {insights.keyHighlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  {index === 0 && <Users className="text-blue-500" size={20} />}
                  {index === 1 && <GitPullRequest className="text-purple-500" size={20} />}
                  {index === 2 && <ThumbsUp className="text-green-500" size={20} />}
                  {index === 3 && (insights.weeklyChange.issues > 0 ? 
                    <TrendingUp className="text-green-500" size={20} /> : 
                    <TrendingDown className="text-red-500" size={20} />
                  )}
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 