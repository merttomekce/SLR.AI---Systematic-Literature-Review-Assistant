'use client';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
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
      headerDescription="Compare inclusion/exclusion decisions across multiple AI models"
    >
      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        
        {!hasEnoughRuns ? (
          <Card className="p-12 text-center border-dashed">
             <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
             <h3 className="text-lg font-semibold text-foreground mb-2">
               Multiple Runs Required
             </h3>
             <p className="text-muted-foreground mb-6">
               To compare AI decisions, you need to save at least two runs in Step 1 using different models or prompts.
             </p>
             <Link href="/review/setup">
               <Button className="gap-2">
                 Go Setup a New Run
               </Button>
             </Link>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6 border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Agreement (AGREE)</p>
                <p className="text-2xl font-bold text-green-600">{agreementStats['AGREE'] || 0} papers</p>
              </Card>
              <Card className="p-6 border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">Partial / N/A (PARTIAL)</p>
                <p className="text-2xl font-bold text-amber-600">{agreementStats['PARTIAL'] || 0} papers</p>
              </Card>
              <Card className="p-6 border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Conflict (CONFLICT)</p>
                <p className="text-2xl font-bold text-red-600">{agreementStats['CONFLICT'] || 0} papers</p>
              </Card>
            </div>

            {/* Model Comparison Table */}
            <Card className="p-6 border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Decision Matrix</h3>
                <Button variant="outline" size="sm" onClick={handleExportComparison} className="gap-2">
                  <Download className="w-4 h-4" /> Export Comparison Excel
                </Button>
              </div>
              <div className="overflow-x-auto border border-border rounded-lg max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 sticky top-0 z-10">
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium w-1/3">
                        Paper Title
                      </th>
                      {savedS1Runs.map(run => (
                        <th key={run.id} className="text-center py-3 px-4 text-muted-foreground font-medium">
                          {run.name}
                          <br/>
                          <span className="text-[10px] font-normal">{run.model}</span>
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">
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
                          className="border-b border-border hover:bg-secondary/20 transition-smooth"
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

            <Card className="p-6 border-border bg-primary/5 border-primary/20 space-y-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-2">How to use this data</p>
                  <p className="text-sm text-foreground/80">
                    Papers marked as <strong>AGREE</strong> can usually be safely proceeded without further manual review. 
                    Papers marked as <strong>CONFLICT</strong> require human adjudication. You can return to the Gate screen and select which run's results you wish to use as the base for Step 2.
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
            <Link href="/">
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
