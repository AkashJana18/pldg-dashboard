import { GitHubPRData } from '@/types/dashboard';
import { NextResponse } from 'next/server';

const USERNAME = 'AkashJana18';

interface PullRequest {
  id: string;
  title: string;
  state: string;
  createdAt: string;
  closedAt: string | null;
  isDraft: boolean;
  mergedAt: string | null;
  url: string;
  number: number;
  assignees: {
    nodes: Array<{ login: string }>;
  };
  reviews: {
    nodes: Array<{
      state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
      author: { login: string };
    }>;
  };
  commits: {
    nodes: Array<{
      commit: {
        statusCheckRollup?: {
          state: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'ERROR';
        };
      };
    }>;
  };
}

export async function GET() {
  try {
    console.log('GitHub PR API route called');
    
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GitHub token not found');
    }

    const headers = {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'PLDG-Dashboard'
    };

    const prQuery = {
      query: `
        query {
          user(login: "${USERNAME}") {
            pullRequests(last: 50) {
              nodes {
                id
                title
                state
                createdAt
                closedAt
                isDraft
                mergedAt
                url
                number
                assignees(first: 1) {
                  nodes {
                    login
                  }
                }
                reviews(first: 10, states: [APPROVED, CHANGES_REQUESTED]) {
                  nodes {
                    state
                    author {
                      login
                    }
                  }
                }
                commits(last: 1) {
                  nodes {
                    commit {
                      statusCheckRollup {
                        state
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
    };

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify(prQuery)
    });

    if (!response.ok) {
      console.error('GitHub API Error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const rawData = await response.json();
    
    if (!rawData?.data?.user?.pullRequests?.nodes) {
      console.error('Invalid GitHub PR response structure:', rawData);
      throw new Error('Invalid response structure from GitHub');
    }

    const prs = rawData.data.user.pullRequests.nodes as PullRequest[];

    const responseData: GitHubPRData = {
      pullRequests: prs.map(pr => ({
        id: pr.id,
        title: pr.title,
        state: pr.state,
        created_at: pr.createdAt,
        closed_at: pr.closedAt,
        isDraft: pr.isDraft,
        isMerged: !!pr.mergedAt,
        url: pr.url,
        number: pr.number,
        assignee: pr.assignees.nodes[0]?.login || undefined,
        reviews: pr.reviews.nodes,
        ciStatus: pr.commits.nodes[0]?.commit?.statusCheckRollup?.state,
        status: getPRStatus(pr)
      })),
      timestamp: Date.now()
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GitHub PR API error:', {
      error,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({ 
      pullRequests: [],
      timestamp: Date.now()
    } as GitHubPRData);
  }
}

function getPRStatus(pr: PullRequest): string {
  if (pr.isDraft) return 'Draft';
  if (pr.mergedAt) return 'Merged';
  if (pr.state === 'CLOSED') return 'Closed';
  
  const hasApprovals = pr.reviews.nodes.some(r => r.state === 'APPROVED');
  const hasChangesRequested = pr.reviews.nodes.some(r => r.state === 'CHANGES_REQUESTED');
  
  if (hasApprovals) return 'Approved';
  if (hasChangesRequested) return 'Changes Requested';
  
  return 'Open';
}