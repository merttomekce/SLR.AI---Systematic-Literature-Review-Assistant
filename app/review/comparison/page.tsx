'use client';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Link from 'next/link';
import { useReviewStore, Paper, Decision, ReviewRun } from '@/store/useReviewStore';
import { exportToExcel } from '@/lib/fileParser';

export default function ComparisonPage() {
  const { savedS1Runs } = useReviewStore();

  // If we only have 0 or 1 runs, there's nothing to compare. But we can still show a placeholder.
  const hasEnoughRuns = savedS1Runs.length > 1;

  // Build a matrix table
  // Each row is a paper (from the first run, assuming all runs share the same base papers mostly)
  let papersMatrix: Record<string, { title: string; decisions: Record<string, Decision | undefined> }> = {};

  if (hasEnoughRuns) {
    // Collect all unique papers across all runs
    savedS1Runs.forEach(run => {
      Object.values(run.papers).forEach(p => {
        if (!papersMatrix[p.id]) {
          papersMatrix[p.id] = { title: p.title, decisions: {} };
        }
        papersMatrix[p.id].decisions[run.id] = p.s1Decision;
      });
    });
  }

  const paperRows = Object.values(papersMatrix);

  // Calculate agreement
  const getAgreement = (decisions: Record<string, Decision | undefined>) => {
    const validDecisions = Object.values(decisions).filter(d => d !== 'PENDING' && d !== 'ANALYZING' && d !== undefined);
    if (validDecisions.length === 0) return { label: 'PENDING', badge: 'bg-muted/20 text-muted-foreground border-muted' };

    // Check if all are the same
    const firstDecision = validDecisions[0];
    const allSame = validDecisions.every(d => d === firstDecision);

    if (allSame) {
      return {
        label: 'AGREE',
        badge: 'bg-green-500/20 text-green-600 border-green-200',
        icon: <CheckCircle2 className="w-4 h-4 mr-1 inline" />
      };
    }

    const includedCount = validDecisions.filter(d => d === 'INCLUDED').length;
    const excludedCount = validDecisions.filter(d => d === 'EXCLUDED').length;

    if (includedCount > 0 && excludedCount > 0) {
      return {
        label: 'CONFLICT',
        badge: 'bg-red-500/20 text-red-600 border-red-200',
        icon: <AlertCircle className="w-4 h-4 mr-1 inline" />
      };
    }

    return {
      label: 'PARTIAL',
      badge: 'bg-amber-500/20 text-amber-600 border-amber-200',
      icon: <AlertTriangle className="w-4 h-4 mr-1 inline" />
    };
  };

  const handleExportComparison = () => {
    if (!hasEnoughRuns) return;

    const exportData = paperRows.map(row => {
      const data: Record<string, string> = { Title: row.title };
      savedS1Runs.forEach(run => {
        data[`\${run.name} (\${run.model})`] = row.decisions[run.id] || 'Not Processed';
      });
      data['Agreement'] = getAgreement(row.decisions).label;
      return data;
    });

    exportToExcel([
      { name: 'S1 Comparison', data: exportData }
    ], `SLR_AI_Comparison.xlsx`);
  };

  const agreementStats = paperRows.reduce((acc, row) => {
    const st = getAgreement(row.decisions).label;
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <LayoutWrapper
      headerTitle="Run Comparison"
      headerDescription={
        <span className="flex items-center gap-2">
          Compare inclusion/exclusion decisions across multiple AI models
          <HoverCard>
            <HoverCardTrigger className="cursor-help">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </HoverCardTrigger>
            <HoverCardContent className="w-[300px] text-xs shadow-xl border-border z-[100] font-normal" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground border-b border-border pb-1">Guidelines</h4>
                <p className="text-muted-foreground leading-relaxed">
                  This screen compares the results of multiple independent AI screening runs evaluating the exact same base papers. Use this tool to identify where different models agree (safe to proceed) or conflict (requiring human adjudication).
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </span>
      }
    >
      <div className="p-6 space-y-8 animate-in fade-in duration-500">

        {!hasEnoughRuns ? (
          <Card className="p-12 text-center border-dashed border-border/50 bg-transparent shadow-none hover:shadow-none">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Multiple Runs Required
            </h3>
            <p className="text-muted-foreground mb-6">
              To compare AI decisions, you need to save at least two runs in Step 1 using different models or prompts.
            </p>
            <Link href="/review/setup">
              <Button className="gap-2 button-hover-lift">
                Go Setup a New Run
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
                <p className="text-xs-caps mb-1">Total Agreement (AGREE)</p>
                <p className="text-2xl font-mono tracking-tight text-green-500">{agreementStats['AGREE'] || 0} papers</p>
              </Card>
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
                <p className="text-xs-caps mb-1">Partial / N/A (PARTIAL)</p>
                <p className="text-2xl font-mono tracking-tight text-amber-500">{agreementStats['PARTIAL'] || 0} papers</p>
              </Card>
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
                <p className="text-xs-caps mb-1">Total Conflict (CONFLICT)</p>
                <p className="text-2xl font-mono tracking-tight text-destructive">{agreementStats['CONFLICT'] || 0} papers</p>
              </Card>
            </div>

            {/* Model Comparison Table */}
            <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden max-h-[700px]">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="font-medium text-sm text-foreground">Decision Matrix</h3>
                <Button variant="outline" size="sm" onClick={handleExportComparison} className="gap-2 text-xs">
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </Button>
              </div>
              <div className="overflow-x-auto flex-1 relative">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
                    <tr>
                      <th className="text-left py-3 px-4 w-1/3 text-xs-caps">
                        Paper Title
                      </th>
                      {savedS1Runs.map(run => (
                        <th key={run.id} className="text-center py-3 px-4 text-xs-caps">
                          {run.name}
                          <br />
                          <span className="text-[9px] font-normal opacity-70 tracking-normal normal-case">{run.model}</span>
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 text-xs-caps">
                        Agreement
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paperRows.map((row, idx) => {
                      const agreement = getAgreement(row.decisions);
                      return (
                        <tr
                          key={idx}
                          className="border-b border-border/50 hover:bg-secondary/20 transition-smooth"
                        >
                          <td className="py-3 px-4 font-medium text-foreground">
                            <span className="line-clamp-2" title={row.title}>{row.title}</span>
                          </td>
                          {savedS1Runs.map(run => {
                            const dec = row.decisions[run.id];
                            return (
                              <td key={run.id} className="text-center py-3 px-4">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-sm \${
                                    dec === 'INCLUDED' ? 'bg-green-500/10 text-green-600' :
                                    dec === 'EXCLUDED' ? 'bg-red-500/10 text-red-600' :
                                    'bg-muted/10 text-muted-foreground'
                                  }`}>
                                  {dec || 'N/A'}
                                </span>
                              </td>
                            )
                          })}
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline" className={agreement.badge}>
                              {agreement.icon}
                              {agreement.label}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-secondary/30 backdrop-blur-sm space-y-4 shadow-none">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground mb-1">How to use this data</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Papers marked as <strong className="text-foreground font-medium">AGREE</strong> can usually be safely proceeded without further manual review.
                    Papers marked as <strong className="text-foreground font-medium">CONFLICT</strong> require human adjudication. You can return to the Gate screen and select which run's results you wish to use as the base for Step 2.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link href="/review/fulltext">
            <Button variant="outline" className="border-border hover:bg-secondary">
              Go to Full-Text Review
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                <FileText className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
