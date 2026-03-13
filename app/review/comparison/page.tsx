'use client';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle2, AlertCircle, AlertTriangle, Info, Copy } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Link from 'next/link';
import { useReviewStore, Paper, Decision, ReviewRun } from '@/store/useReviewStore';
import { exportToExcel } from '@/lib/fileParser';

export default function ComparisonPage() {
  const { savedS1Runs } = useReviewStore();

  const hasEnoughRuns = savedS1Runs.length > 1;

  let papersMatrix: Record<string, { title: string; decisions: Record<string, Decision | undefined> }> = {};

  if (hasEnoughRuns) {
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

  const getAgreement = (decisions: Record<string, Decision | undefined>) => {
    const validDecisions = Object.values(decisions).filter(d => d !== 'PENDING' && d !== 'ANALYZING' && d !== undefined);
    if (validDecisions.length === 0) return { label: 'PENDING', bgClass: '', status: 'pending' };

    const firstDecision = validDecisions[0];
    const allSame = validDecisions.every(d => d === firstDecision);

    if (allSame) {
      return {
        label: 'AGREE',
        bgClass: 'bg-green-500/[0.03] hover:bg-green-500/[0.05]',
        status: 'agree'
      };
    }

    const includedCount = validDecisions.filter(d => d === 'INCLUDED').length;
    const excludedCount = validDecisions.filter(d => d === 'EXCLUDED').length;

    if (includedCount > 0 && excludedCount > 0) {
      return {
        label: 'CONFLICT',
        bgClass: 'bg-red-500/[0.03] hover:bg-red-500/[0.05]',
        status: 'conflict'
      };
    }

    return {
      label: 'PARTIAL',
      bgClass: 'bg-yellow-500/[0.03] hover:bg-yellow-500/[0.05]',
      status: 'partial'
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

  const totalEvaluated = paperRows.length;
  const agreementPercentage = totalEvaluated > 0 ? Math.round(((agreementStats['AGREE'] || 0) / totalEvaluated) * 100) : 0;

  return (
    <LayoutWrapper
      headerTitle="Model Comparison"
      headerDescription="Compare AI inclusion/exclusion decisions across independent runs"
    >
      <div className="p-6 h-[calc(100vh-80px)] flex flex-col max-w-[1800px] mx-auto animate-in fade-in duration-500 bg-background text-foreground overflow-hidden">

        {!hasEnoughRuns ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-12 text-center bg-secondary border border-border backdrop-blur-sm max-w-md w-full">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-widest text-xs">
                Multiple Runs Required
              </h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                To compare AI decisions, you need to save at least two runs in Step 1 using different models or prompts.
              </p>
              <Link href="/review/setup">
                <Button className="w-full gap-2 bg-foreground text-background hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] rounded-full h-12 transition-transform hover:scale-105 active:scale-95">
                  Initiate New Run
                </Button>
              </Link>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-8">
            {/* Top Stat Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Pseudo dropdowns for models */}
                <div className="flex gap-2 p-1.5 rounded-full bg-secondary border border-border">
                  {savedS1Runs.slice(0, 3).map((run, i) => (
                    <div key={run.id} className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">{run.name}</span>
                    </div>
                  ))}
                  {savedS1Runs.length > 3 && (
                    <div className="flex items-center px-4 py-2 bg-secondary rounded-full text-[10px] text-muted-foreground">{`+\${savedS1Runs.length - 3} MORE`}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Conflicts</p>
                  <p className="text-xl font-mono text-red-500">{agreementStats['CONFLICT'] || 0}</p>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Agreement Rate</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono tracking-tight text-foreground">{agreementPercentage}%</span>
                    <div className={`h-2 w-2 rounded-full animate-pulse \${agreementPercentage > 85 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* DATA MATRIX TABLE */}
            <div className="flex-1 flex flex-col bg-card/80 backdrop-blur-xl border border-border rounded-3xl overflow-hidden min-h-0 relative">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none z-20" />

              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0 relative z-10">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                  <Copy className="w-4 h-4 text-purple-400" /> Matrix Comparison
                </h3>
                <Button onClick={handleExportComparison} className="h-9 px-5 gap-2 bg-white/10 hover:bg-white/20 text-foreground font-bold uppercase tracking-widest text-[9px] rounded-full border border-border transition-all">
                  <Download className="w-3.5 h-3.5" /> Export Selection
                </Button>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar relative z-10">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 bg-card/90 backdrop-blur-xl z-10 border-b border-border">
                    <tr>
                      <th className="py-4 px-6 w-[400px] text-[10px] uppercase tracking-widest font-bold text-muted-foreground whitespace-nowrap">Paper Context</th>
                      {savedS1Runs.map(run => (
                        <th key={run.id} className="py-4 px-6 text-center text-[10px] uppercase tracking-widest font-bold text-muted-foreground min-w-[150px]">
                          {run.name}
                          <div className="text-[8px] font-mono text-blue-400/80 mt-1 opacity-70 tracking-normal normal-case">{run.model}</div>
                        </th>
                      ))}
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paperRows.map((row, idx) => {
                      const agreement = getAgreement(row.decisions);
                      return (
                        <tr key={idx} className={`\${agreement.bgClass} transition-colors group`}>
                          <td className="py-5 px-6 font-medium text-foreground">
                            <span className="line-clamp-2 leading-relaxed" title={row.title}>{row.title}</span>
                          </td>
                          {savedS1Runs.map(run => {
                            const dec = row.decisions[run.id];
                            return (
                              <td key={run.id} className="py-5 px-6 text-center">
                                {dec ? (
                                  <span className={`text-[9px] uppercase font-bold tracking-widest border px-2.5 py-1 rounded \${
                                       dec === 'INCLUDED' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]' :
                                       dec === 'EXCLUDED' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]' :
                                       'bg-secondary text-muted-foreground border-border'
                                     }`}>
                                    {dec}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 font-mono">-</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="py-5 px-6 text-center">
                            {agreement.status === 'agree' && <CheckCircle2 className="w-5 h-5 text-green-500/50 mx-auto" />}
                            {agreement.status === 'conflict' && <AlertCircle className="w-5 h-5 text-red-500/80 mx-auto" />}
                            {agreement.status === 'partial' && <AlertTriangle className="w-5 h-5 text-yellow-500/50 mx-auto" />}
                            {agreement.status === 'pending' && <span className="text-muted-foreground/50">-</span>}
                          </td>
                        </tr>
                      )
                    })}
                    {paperRows.length === 0 && (
                      <tr>
                        <td colSpan={savedS1Runs.length + 2} className="py-12 text-center text-muted-foreground text-xs tracking-widest uppercase">
                          No shared papers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
